# app/core/rag_pipeline.py
from __future__ import annotations

import logging
import math
import os
import time
from typing import Any, Dict, List, Optional

from langchain.chains import LLMChain
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
from backend.app.schemas.llm_outputs import BatchProductAnalysis, ProductAnalysis, ReviewHighlights

logger = logging.getLogger(__name__)


class RAGPipeline:
    """Handles LLM prompting for the RAG flow, including batched analyses."""

    def __init__(self, llm_client: BaseLLM):
        self.llm_client = llm_client

        self.prompt_template = PromptTemplate(
            input_variables=[
                "query",
                "product_title",
                "cleaned_item_description",
                "product_categories",
                "reviews",
            ],
            template="""
            You are an expert product analyst. Analyze the following product details and customer reviews to provide a comprehensive summary.

            Product Details:
            - Title: {product_title}
            - Description: {cleaned_item_description}
            - Categories: {product_categories}

            Customer Reviews:
            {reviews}

            Analysis should include:

            1.  Detailed Product Feature Analysis:
                 Identify and list the top 3-5 key features, focusing on aspects related to:
                    - Ingredients and their benefits (if applicable).
                    - Functionality and performance.
                    - Design and usability.
                Please specify how each feature is relevant to the product's function.

            2.  Review Sentiment Analysis:
                 Summarize the overall sentiment of the reviews (positive, negative, or mixed).
                 Extract and highlight specific positive and negative feedback points, citing examples from the reviews.
                 focus on common themes within the reviews.

            3.  Target audience and use case:
                 Who is this product best suited for?
                 In what situations would this product be most useful?

            Return the analysis in the following structured format, providing detailed and specific information:

            -   Main selling points:
                  Feature 1: [Detailed description, explaining its relevance and benefits.]
                  Feature 2: [Detailed description, explaining its relevance and benefits.]
                  Feature3: [Detailed description, explaining its relevance and benefits.]
            -   Best for: [Specific description of the ideal user and use case, with justifications.]
            -   Review highlights:
                  Overall Sentiment: [Positive/Negative/Mixed]
                  Positive Feedback:
                     [Specific review quote or summary] - [Explanation of the positive aspect]
                     [Another specific review quote or summary] - [Explanation of the positive aspect]
                  Negative Feedback:
                     [Specific review quote or summary] - [Explanation of the negative aspect]
                     [Another specific review quote or summary] - [Explanation of the negative aspect]

Please ensure your analysis is based solely on the provided product details and customer reviews.
            """,
        )
        self.chain = LLMChain(llm=self.llm_client, prompt=self.prompt_template)

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

    async def generate_explanation(
        self, query: str, product_info: Dict[str, Any], reviews: List[Dict[str, Any]]
    ) -> str:
        """Legacy helper that returns free-form text for debugging."""

        review_text = "\n".join(
            [
                f"- ⭐{rev.get('rating', 'NA')}: {self._sanitize_text(rev.get('content', ''))}"
                for rev in reviews
            ]
        )

        return await self.chain.arun(
            {
                "query": query,
                "product_title": product_info.get("product_title", ""),
                "cleaned_item_description": product_info.get(
                    "cleaned_item_description", ""
                ),
                "product_categories": product_info.get("product_categories", ""),
                "reviews": review_text,
            }
        )

    async def generate_batch_explanations(
        self, query: str, products: List[Dict[str, Any]], chunk_size: Optional[int] = None
    ) -> List[ProductAnalysis]:
        """Generate structured analyses for a batch of products.

        The method chunks products to stay within model limits, validates structured output
        with `PydanticOutputParser`, and falls back to single-product calls on parse errors.
        """

        if not products:
            return []

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
                            analysis_by_asin[result.asin] = result
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
                        analysis_by_asin[result.asin] = result

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
        raw_output = await self.llm_client.apredict(prompt_text)
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
                        results.append(batch_results[0])
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
        return ProductAnalysis(
            asin=asin,
            main_selling_points=[],
            best_for="Information unavailable",
            review_highlights=highlights,
            warnings=[warning],
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