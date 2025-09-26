# app/core/rag_pipeline.py
from __future__ import annotations

import logging
import math
import os
import re
import time
from typing import Any, Dict, List, Optional

from langchain.output_parsers import PydanticOutputParser
from langchain.prompts import PromptTemplate
from langchain_core.exceptions import OutputParserException
from langchain_core.language_models import BaseLLM
from pydantic import ValidationError

try:  # pragma: no cover - optional dependency
    import tiktoken  # type: ignore
except ImportError:  # pragma: no cover - handled at runtime
    tiktoken = None

from backend.app.config import (
    RAG_BATCHING_ENABLED,
    RAG_BATCH_SIZE,
    RAG_MAX_PROMPT_TOKENS,
    RAG_MAX_REVIEW_CHARS,
)
from backend.app.schemas.llm_outputs import BatchProductAnalysis, KeySpec, ProductAnalysis, ReviewHighlights

logger = logging.getLogger(__name__)


class RAGPipeline:
    """Handles LLM prompting for the RAG flow, including batched analyses."""

    def __init__(self, llm_client: BaseLLM):
        self.llm_client = llm_client

        self.batch_parser = PydanticOutputParser(pydantic_object=BatchProductAnalysis)
        self.batch_prompt_template = PromptTemplate(
            input_variables=[
                "query",
                "product_blocks",
                "format_instructions",
                "extra_instructions",
            ],
            template="""
            You are an expert retail product analyst. Given a shopper query and multiple products with sampled reviews, create a structured JSON response that follows the provided schema exactly.

            Shopper query: {query}

            Products to analyze:
            {product_blocks}

                Analysis requirements (apply to every product):
                    1. Key Specifications Table → `key_specs`
                        • Parse the product description and any structured specs to extract 4-8 concise shopper-relevant attributes.
                        • Each entry MUST be an object with `feature` (short label ≤ 6 words) and `detail` (≤ 140 characters) fields.
                        • Prioritize tangible data such as dimensions, materials, capacity, included accessories, certifications, power details, or care instructions. Skip marketing slogans.
                        • If no trustworthy attributes exist, return an empty array.

                    2. Detailed Product Feature Analysis → `main_selling_points`
                        • Produce 3-5 selling points ranked by shopper relevance.
                        • For each entry, represent the data as an object with `title` (if available) and `description` fields.
                    • Anchor the description in the product content: discuss ingredients and their benefits where relevant, describe functionality/performance outcomes, and highlight design or usability elements. Explain *why* each feature matters for the shopper in 2-3 full sentences.

                3. Review Sentiment Analysis → `review_highlights`
                    • Derive the overall sentiment (positive/negative/mixed/unknown) from the reviews included in the product block.
                    • When reviews are present, aim for ≥2 positive and ≥2 negative highlight items; fewer is acceptable only if the source material does not support more.
                    • Each highlight requires a concise summary plus a 1-2 sentence explanation that cites concrete evidence (paraphrase or quote). If a direct quote is available, populate the `quote`; otherwise set it to null.

                4. Target audience & use case → `best_for`
                    • Write 2-3 sentences describing who benefits most, which situations or pain points the product addresses, and the reasoning tied to captured features or sentiments.

                Additional instructions:
                • Base all statements strictly on the provided product data and reviews; do not invent facts.
                • If no usable reviews exist, set `review_highlights.overall_sentiment` to "unknown" and leave both `positive` and `negative` arrays empty.
                • Use the `warnings` field only for critical caveats or evident data gaps; omit it when unnecessary.
                • Keep the tone specific and shopper-focused—avoid vague claims like "good quality" without supporting detail.

            {extra_instructions}

            {format_instructions}

            Return ONLY valid JSON that matches the schema. Do not include markdown fences, commentary, or any additional text outside of the JSON payload.
            """,
        )

        self.batching_enabled = RAG_BATCHING_ENABLED
        self.default_chunk_size = max(1, RAG_BATCH_SIZE)
        self.max_prompt_tokens = RAG_MAX_PROMPT_TOKENS
        self.max_review_chars = RAG_MAX_REVIEW_CHARS
        self._token_encoder = self._maybe_create_token_encoder()

    async def generate_batch_explanations(
        self, query: str, products: List[Dict[str, Any]], chunk_size: Optional[int] = None
    ) -> List[ProductAnalysis]:
        """Generate structured analyses for a batch of products.

        The method chunks products to stay within model limits, validates structured output
        with `PydanticOutputParser`, and falls back to single-product calls on parse errors.
        """

        if not products:
            return []

        product_lookup: Dict[str, Dict[str, Any]] = {}
        for product in products:
            asin = product.get("asin")
            if asin:
                product_lookup[str(asin)] = product

        effective_chunk_size = max(1, chunk_size or self.default_chunk_size)
        batching_enabled = self.batching_enabled and effective_chunk_size > 1

        if not batching_enabled:
            logger.info(
                "Batching disabled; generating analyses sequentially",
                extra={"product_count": len(products)},
            )
            per_product = await self._generate_per_product(query, products)
            return self._ordered_results(products, per_product)

        analysis_by_asin: Dict[str, ProductAnalysis] = {}
        chunks = self._chunk_products(products, effective_chunk_size)
        logger.info(
            "Submitting %s chunks for batched analysis",
            len(chunks),
            extra={
                "product_count": len(products),
                "chunk_size": effective_chunk_size,
                "max_prompt_tokens": self.max_prompt_tokens,
            },
        )

        for idx, chunk in enumerate(chunks):
            logger.debug(
                "Processing chunk %s/%s", idx + 1, len(chunks), extra={"chunk_size": len(chunk)}
            )
            success = False
            for attempt in range(2):
                try:
                    results = await self._invoke_batch(query, chunk, attempt)
                    for result in results:
                        if result.asin:
                            product_info = product_lookup.get(result.asin)
                            analysis_by_asin[result.asin] = self._post_process_analysis(
                                product_info, result
                            )
                    success = True
                    break
                except (OutputParserException, ValidationError) as exc:
                    logger.warning(
                        "Parse failure on batch chunk",
                        extra={
                            "chunk_index": idx,
                            "chunk_size": len(chunk),
                            "attempt": attempt + 1,
                            "error": str(exc),
                        },
                    )

            if not success:
                logger.error(
                    "Falling back to per-product generation for chunk",
                    extra={"chunk_index": idx, "chunk_size": len(chunk)},
                )
                per_product = await self._generate_per_product(query, chunk)
                for result in per_product:
                    if result.asin:
                        product_info = product_lookup.get(result.asin)
                        analysis_by_asin[result.asin] = self._post_process_analysis(
                            product_info, result
                        )

        return self._ordered_results(products, list(analysis_by_asin.values()))

    async def _invoke_batch(
        self, query: str, chunk: List[Dict[str, Any]], attempt: int
    ) -> List[ProductAnalysis]:
        extra_instruction = (
            "This is a retry because the previous response was not valid JSON. Ensure the"
            " output is a JSON object that matches the schema exactly."
            if attempt
            else "Follow the schema exactly for every product."
        )

        prompt_text = self.batch_prompt_template.format(
            query=query,
            product_blocks="\n\n".join(self._format_product_block(p) for p in chunk),
            format_instructions=self.batch_parser.get_format_instructions(),
            extra_instructions=extra_instruction,
        )

        start = time.perf_counter()
        # langchain-core deprecated `apredict` in favor of `ainvoke`.
        # Use `ainvoke` for async invocation of the LLM with the prompt text.
        raw_output = await self.llm_client.ainvoke(prompt_text)
        latency_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "LLM batch call complete",
            extra={
                "chunk_size": len(chunk),
                "attempt": attempt + 1,
                "latency_ms": round(latency_ms, 2),
            },
        )

        parsed: BatchProductAnalysis = self.batch_parser.parse(raw_output)
        logger.info(
            "Parsed batch chunk",
            extra={"chunk_size": len(chunk), "parsed_count": len(parsed.results)},
        )
        return parsed.results

    async def _generate_per_product(
        self, query: str, products: List[Dict[str, Any]]
    ) -> List[ProductAnalysis]:
        results: List[ProductAnalysis] = []
        for product in products:
            generated = False
            for attempt in range(2):
                try:
                    batch_results = await self._invoke_batch(query, [product], attempt)
                    if batch_results:
                        processed = self._post_process_analysis(product, batch_results[0])
                        results.append(processed)
                        generated = True
                        break
                except (OutputParserException, ValidationError) as exc:
                    logger.warning(
                        "Parse failure on per-product generation",
                        extra={
                            "asin": product.get("asin"),
                            "attempt": attempt + 1,
                            "error": str(exc),
                        },
                    )

            if not generated:
                logger.error(
                    "Unable to generate structured analysis for product; returning placeholder",
                    extra={"asin": product.get("asin")},
                )
                results.append(self._placeholder_analysis(product))

        return results

    def _post_process_analysis(
        self, product: Optional[Dict[str, Any]], analysis: ProductAnalysis
    ) -> ProductAnalysis:
        """Normalize optional fields and ensure key specs are available."""

        cleaned_specs: List[KeySpec] = []
        seen_features: set[str] = set()
        raw_specs = analysis.key_specs or []

        for spec in raw_specs:
            if not spec:
                continue

            feature = getattr(spec, "feature", "") or ""
            detail = getattr(spec, "detail", "") or ""
            feature = feature.strip()
            detail = detail.strip()

            if not feature or not detail:
                continue

            feature_words = feature.split()
            if len(feature_words) > 6:
                feature = " ".join(feature_words[:6]).strip()

            dedupe_key = feature.lower()
            if dedupe_key in seen_features:
                continue

            seen_features.add(dedupe_key)
            clipped_detail = detail if len(detail) <= 200 else detail[:197] + "…"
            cleaned_specs.append(KeySpec(feature=feature, detail=clipped_detail))

            if len(cleaned_specs) >= 8:
                break

        if cleaned_specs:
            analysis.key_specs = cleaned_specs
        else:
            analysis.key_specs = self._derive_key_specs(product)

        if analysis.key_specs is None:
            analysis.key_specs = []

        return analysis

    def _ordered_results(
        self, products: List[Dict[str, Any]], analyses: List[ProductAnalysis]
    ) -> List[ProductAnalysis]:
        by_asin = {analysis.asin: analysis for analysis in analyses if analysis.asin}
        ordered: List[ProductAnalysis] = []
        for product in products:
            asin = product.get("asin")
            if asin in by_asin:
                ordered.append(by_asin[asin])
            else:
                ordered.append(self._placeholder_analysis(product))
        return ordered

    def _format_product_block(self, product: Dict[str, Any]) -> str:
        asin = product.get("asin", "")
        title = self._sanitize_text(product.get("product_title", "Unknown Title"))
        description = self._sanitize_text(product.get("cleaned_item_description", ""))
        categories = self._sanitize_text(product.get("product_categories", ""))

        reviews = product.get("reviews", []) or []
        if reviews:
            review_lines = []
            for idx, review in enumerate(reviews, start=1):
                content = self._truncate(self._sanitize_text(review.get("content", "")))
                rating = review.get("rating")
                verified = review.get("verified_purchase")
                review_lines.append(
                    f"    {idx}. rating={rating if rating is not None else 'NA'},"
                    f" verified={bool(verified)}\n       {content}"
                )
            review_text = "\n".join(review_lines)
        else:
            review_text = "    None provided. Return empty arrays for review highlights."

        return (
            f"Product ASIN: {asin}\n"
            f"Title: {title}\n"
            f"Description: {description}\n"
            f"Categories: {categories}\n"
            f"Reviews (truncated to {self.max_review_chars} chars each):\n{review_text}"
        )

    def _chunk_products(
        self, products: List[Dict[str, Any]], chunk_size: int
    ) -> List[List[Dict[str, Any]]]:
        chunks: List[List[Dict[str, Any]]] = []
        current_chunk: List[Dict[str, Any]] = []
        current_tokens = 0

        for product in products:
            product_tokens = self._estimate_product_tokens(product)

            fits_size = len(current_chunk) < chunk_size
            fits_tokens = (current_tokens + product_tokens) <= self.max_prompt_tokens

            if current_chunk and (not fits_size or not fits_tokens):
                chunks.append(current_chunk)
                current_chunk = []
                current_tokens = 0

            current_chunk.append(product)
            current_tokens += product_tokens

        if current_chunk:
            chunks.append(current_chunk)

        return chunks

    def _estimate_product_tokens(self, product: Dict[str, Any]) -> int:
        base_text = "\n".join(
            [
                str(product.get("product_title", "")),
                str(product.get("cleaned_item_description", "")),
                str(product.get("product_categories", "")),
            ]
        )
        token_count = self._estimate_tokens(base_text)
        for review in product.get("reviews", []) or []:
            token_count += self._estimate_tokens(review.get("content", ""))

        # Reserve overhead for instructions and formatting
        return token_count + 200

    def _estimate_tokens(self, text: str) -> int:
        if not text:
            return 0
        if self._token_encoder:
            try:
                return len(self._token_encoder.encode(text))
            except Exception:
                pass
        # Fallback heuristic: assume ~4 characters per token
        return max(1, math.ceil(len(text) / 4))

    def _truncate(self, text: str) -> str:
        if len(text) <= self.max_review_chars:
            return text
        return text[: self.max_review_chars] + "…"

    @staticmethod
    def _sanitize_text(value: Any) -> str:
        if value is None:
            return ""
        text = str(value).replace("\r\n", "\n").replace("\r", "\n")
        return "".join(ch for ch in text if ch == "\n" or ord(ch) >= 32)

    def _derive_key_specs(self, product: Optional[Dict[str, Any]]) -> List[KeySpec]:
        if not product:
            return []

        description = product.get("cleaned_item_description")
        if not isinstance(description, str) or not description.strip():
            return []

        normalized = description.replace("\r\n", "\n").replace("\r", "\n")
        normalized = normalized.replace("[", "\n").replace("]", "\n")
        normalized = re.sub(r",\s*:", ":", normalized)
        normalized = re.sub(r"\s{2,}", " ", normalized)

        segments = re.split(r"[\n•;]|(?<!\d),(?=\s*[A-Z])", normalized)

        specs: List[KeySpec] = []
        seen: set[str] = set()

        for raw_segment in segments:
            candidate = raw_segment.strip()
            if not candidate:
                continue

            if ":" not in candidate and " - " in candidate:
                candidate = candidate.replace(" - ", ": ", 1)

            if ":" not in candidate:
                continue

            feature_part, detail_part = candidate.split(":", 1)
            feature = feature_part.strip(" •-.,;").strip()
            if "." in feature:
                feature = re.split(r"[.?!]\s*", feature)[-1].strip()
            detail = detail_part.strip(" •-.,;").strip()

            if not feature or not detail:
                continue

            feature_words = feature.split()
            if len(feature_words) > 6:
                feature = " ".join(feature_words[:6]).strip()

            key = feature.lower()
            if key in seen:
                continue

            seen.add(key)
            clipped_detail = detail if len(detail) <= 200 else detail[:197] + "…"
            specs.append(KeySpec(feature=feature, detail=clipped_detail))

            if len(specs) >= 8:
                break

        return specs

    def _placeholder_analysis(self, product: Dict[str, Any]) -> ProductAnalysis:
        asin = product.get("asin", "unknown")
        warning = (
            "LLM was unable to produce structured output. This entry contains placeholder values."
        )
        highlights = ReviewHighlights(
            overall_sentiment="unknown",
            positive=[],
            negative=[],
        )
        key_specs = self._derive_key_specs(product)
        return ProductAnalysis(
            asin=asin,
            main_selling_points=[],
            best_for="Information unavailable",
            review_highlights=highlights,
            warnings=[warning],
            key_specs=key_specs,
        )

    def _maybe_create_token_encoder(self):
        encoder = None
        preferred_encoding = os.environ.get("RAG_TIKTOKEN_ENCODING", "cl100k_base")
        if tiktoken is None:
            logger.debug("tiktoken not installed; falling back to heuristic estimator")
            return None

        try:
            encoder = tiktoken.get_encoding(preferred_encoding)
            logger.debug("Loaded tiktoken encoder '%s'", preferred_encoding)
        except Exception as exc:
            logger.debug("tiktoken unavailable (%s); falling back to heuristic estimator", exc)
        return encoder