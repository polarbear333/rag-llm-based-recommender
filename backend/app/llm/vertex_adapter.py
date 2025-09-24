# app/llm/vertex_adapter.py
from langchain_core.language_models import BaseLLM
from langchain_core.runnables import Runnable
from langchain_core.outputs import LLMResult, Generation
from pydantic import Field
from typing import List, Optional, Any
from typing import Dict


class VertexAILangChainWrapper(BaseLLM, Runnable):
    client: Any = Field(..., description="VertexAI client instance")

    def __init__(self, vertex_client: Any):
        super().__init__(client=vertex_client)  

    def _generate(
        self,
        prompts: List[str],
        stop: Optional[List[str]] = None,
        **kwargs: Any
    ) -> LLMResult:
        responses = [self.client.generate_text(prompt=prompt) for prompt in prompts]
        return LLMResult(
            generations=[[Generation(text=response)] for response in responses]
        )

    async def _agenerate(self, prompts: List[str], stop: Optional[List[str]] = None, **kwargs: Any) -> LLMResult:
        responses = []
        for prompt in prompts:
            response = await self.client.generate_text(prompt=prompt) # Call with await since VertexAIClient.generate_text is async
            responses.append(response)
        return LLMResult(
            generations=[[Generation(text=response)] for response in responses]
        )


    @property
    def _llm_type(self) -> str:
        return "vertexai_wrapper"

    @property
    def _identifying_params(self) -> Dict[str, Any]:
        """Get the identifying parameters."""
        return {"model_name": "underlying-vertex-ai-model"} # Customize as needed