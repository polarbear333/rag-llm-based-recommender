# app/llm/vertex_adapter.py
from langchain_core.language_models import BaseLLM
from langchain_core.runnables import Runnable
from langchain_core.outputs import LLMResult, Generation
from pydantic import Field
from typing import List, Optional, Any, Dict
import asyncio
import logging

logger = logging.getLogger(__name__)


class VertexAILangChainWrapper(BaseLLM, Runnable):
    client: Any = Field(..., description="VertexAI client instance")

    def __init__(self, vertex_client: Any):
        super().__init__(client=vertex_client)

    def _generate(self, prompts: List[str], stop: Optional[List[str]] = None, **kwargs: Any) -> LLMResult:
        # The underlying client exposes async methods; to keep sync behavior safe, run them in threads.
        responses = []
        for prompt in prompts:
            try:
                response = asyncio.get_event_loop().run_until_complete(self.client.generate_text(prompt))
            except RuntimeError:
                # No running loop in this thread; call generate_text in a new thread
                response = asyncio.new_event_loop().run_until_complete(self.client.generate_text(prompt))
            responses.append(response)

        return LLMResult(generations=[[Generation(text=r)] for r in responses])

    async def _agenerate(self, prompts: List[str], stop: Optional[List[str]] = None, **kwargs: Any) -> LLMResult:
        responses = []
        for prompt in prompts:
            # await the client's async generate_text
            response = await self.client.generate_text(prompt)
            responses.append(response)
        return LLMResult(generations=[[Generation(text=r)] for r in responses])

    @property
    def _llm_type(self) -> str:
        return "vertexai_wrapper"

    @property
    def _identifying_params(self) -> Dict[str, Any]:
        return {"model_name": "underlying-vertex-ai-model"}