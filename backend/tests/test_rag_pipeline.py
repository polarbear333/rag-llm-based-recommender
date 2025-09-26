import json
import sys
from pathlib import Path
from typing import List

import pytest
from langchain_core.language_models import BaseLLM
from langchain_core.outputs import Generation, LLMResult

sys.path.append(str(Path(__file__).resolve().parents[2]))

from backend.app import config
from backend.app.core.rag_pipeline import RAGPipeline


class FakeLLM(BaseLLM):
    """Deterministic LLM used to unit-test the batching logic."""

    def __init__(self, responses: List[str]):
        super().__init__()
        self._responses = responses

    def _next_text(self) -> str:
        if not self._responses:
            raise RuntimeError("FakeLLM ran out of responses")
        return self._responses.pop(0)

    def _generate(self, prompts: List[str], stop=None, **kwargs) -> LLMResult:  # type: ignore[override]
        generations = [[Generation(text=self._next_text())] for _ in prompts]
        return LLMResult(generations=generations)

    async def _agenerate(self, prompts: List[str], stop=None, **kwargs) -> LLMResult:  # type: ignore[override]
        generations = [[Generation(text=self._next_text())] for _ in prompts]
        return LLMResult(generations=generations)

    @property
    def _llm_type(self) -> str:
        return "fake"


@pytest.fixture
def sample_products():
    return [
        {
            "asin": "ASIN-1",
            "product_title": "Test Widget",
            "cleaned_item_description": (
                "A widget used for testing. Material: Aluminum alloy. Weight: 1.2 lb. "
                "Dimensions: 5 in × 5 in × 2 in. Included: Carry bag."
            ),
            "product_categories": "Testing,Widgets",
            "reviews": [
                {"content": "Great widget!", "rating": 5, "verified_purchase": True},
                {"content": "Works as expected.", "rating": 4, "verified_purchase": False},
            ],
        }
    ]


@pytest.fixture
def batch_response():
    payload = {
        "results": [
            {
                "asin": "ASIN-1",
                "main_selling_points": [
                    {"title": "Reliability", "description": "Performs consistently."}
                ],
                "best_for": "QA engineers",
                "review_highlights": {
                    "overall_sentiment": "positive",
                    "positive": [
                        {
                            "summary": "Customers like the quality",
                            "explanation": "Reviewers praise the durable feel.",
                            "quote": "Great widget!",
                        }
                    ],
                    "negative": [
                        {
                            "summary": "Minor setup required",
                            "explanation": "Some users mention light assembly.",
                            "quote": "Works as expected.",
                        }
                    ],
                },
                "confidence": 0.9,
                "warnings": [],
                "key_specs": [
                    {"feature": "Material", "detail": "Aluminum alloy"},
                    {"feature": "Weight", "detail": "1.2 lb"},
                ],
            }
        ]
    }
    return json.dumps(payload)


@pytest.fixture
def batch_response_no_key_specs(batch_response):
    data = json.loads(batch_response)
    for result in data.get("results", []):
        result.pop("key_specs", None)
    return json.dumps(data)


@pytest.mark.asyncio
async def test_generate_batch_explanations_success(sample_products, batch_response, monkeypatch):
    monkeypatch.setattr(config, "RAG_BATCHING_ENABLED", True)
    llm = FakeLLM([batch_response])
    pipeline = RAGPipeline(llm)

    analyses = await pipeline.generate_batch_explanations("wireless earbuds", sample_products)

    assert len(analyses) == 1
    analysis = analyses[0]
    assert analysis.asin == "ASIN-1"
    assert analysis.best_for == "QA engineers"
    assert analysis.review_highlights.overall_sentiment == "positive"
    assert analysis.key_specs
    assert analysis.key_specs[0].feature == "Material"


@pytest.mark.asyncio
async def test_generate_batch_explanations_adds_fallback_key_specs(
    sample_products, batch_response_no_key_specs, monkeypatch
):
    monkeypatch.setattr(config, "RAG_BATCHING_ENABLED", True)
    llm = FakeLLM([batch_response_no_key_specs])
    pipeline = RAGPipeline(llm)

    analyses = await pipeline.generate_batch_explanations("wireless earbuds", sample_products)

    assert len(analyses) == 1
    specs = analyses[0].key_specs
    assert specs
    features = {spec.feature for spec in specs}
    assert "Material" in features


@pytest.mark.asyncio
async def test_generate_batch_explanations_fallback_to_per_product(sample_products, batch_response, monkeypatch):
    monkeypatch.setattr(config, "RAG_BATCHING_ENABLED", True)
    # First two responses cause the batch attempts to fail; subsequent responses are for per-product retries
    failing_responses = ["not json", "still not json", batch_response]
    llm = FakeLLM(failing_responses)
    pipeline = RAGPipeline(llm)

    analyses = await pipeline.generate_batch_explanations("wireless earbuds", sample_products, chunk_size=2)

    assert len(analyses) == 1
    assert analyses[0].asin == "ASIN-1"
    assert analyses[0].best_for == "QA engineers"
    assert analyses[0].key_specs


@pytest.mark.asyncio
async def test_generate_batch_explanations_disabled(sample_products, batch_response, monkeypatch):
    monkeypatch.setattr(config, "RAG_BATCHING_ENABLED", False)
    llm = FakeLLM([batch_response])
    pipeline = RAGPipeline(llm)

    analyses = await pipeline.generate_batch_explanations("wireless earbuds", sample_products)

    assert len(analyses) == 1
    assert analyses[0].asin == "ASIN-1"
