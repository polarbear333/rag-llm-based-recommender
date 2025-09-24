"""Dependency factories for FastAPI.

Clients are created lazily to avoid import-time failures when credentials
or environment variables are missing. Factories cache created instances.
"""
from backend.app.llm.vertex_ai_utils import VertexAIClient
from backend.app.llm.vertex_adapter import VertexAILangChainWrapper
from backend.app.core.search_engine import SearchEngine
from backend.app.core.search_service import SearchService
from backend.app.core.rag_pipeline import RAGPipeline
from typing import Optional
import asyncio


_vertex_ai_client: Optional[VertexAIClient] = None
_langchain_llm: Optional[VertexAILangChainWrapper] = None
_search_engine: Optional[SearchEngine] = None
_search_service: Optional[SearchService] = None
_rag_pipeline: Optional[RAGPipeline] = None


def get_vertex_ai_client() -> VertexAIClient:
    global _vertex_ai_client
    if _vertex_ai_client is None:
        _vertex_ai_client = VertexAIClient()
    return _vertex_ai_client


def get_langchain_llm() -> VertexAILangChainWrapper:
    global _langchain_llm
    if _langchain_llm is None:
        _langchain_llm = VertexAILangChainWrapper(get_vertex_ai_client())
    return _langchain_llm


def get_search_engine() -> SearchEngine:
    global _search_engine
    if _search_engine is None:
        _search_engine = SearchEngine(vertex_ai_client=get_vertex_ai_client())
    return _search_engine


def get_search_service_dep() -> SearchService:
    global _search_service
    if _search_service is None:
        _search_service = SearchService(search_engine=get_search_engine())
    return _search_service


def get_rag_pipeline_dep() -> RAGPipeline:
    global _rag_pipeline
    if _rag_pipeline is None:
        _rag_pipeline = RAGPipeline(llm_client=get_langchain_llm())
    return _rag_pipeline


async def initialize_on_startup():
    # Eagerly initialize key clients; called from FastAPI startup event.
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, get_vertex_ai_client)
    # other factories will initialize lazily when requested
