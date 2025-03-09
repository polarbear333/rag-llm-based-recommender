# app/dependencies.py
from backend.app.llm.vertex_ai_utils import VertexAIClient
from backend.app.llm.vertex_adapter import VertexAILangChainWrapper
from backend.app.core.search_engine import SearchEngine
from backend.app.core.search_service import SearchService  # Import SearchService
from backend.app.core.rag_pipeline import RAGPipeline

# Initialize core services in proper sequence
vertex_ai_client = VertexAIClient()
langchain_llm = VertexAILangChainWrapper(vertex_ai_client)
search_engine = SearchEngine(vertex_ai_client=vertex_ai_client)
search_service = SearchService(search_engine=search_engine) # Create SearchService instance
rag_pipeline = RAGPipeline(llm_client=langchain_llm)  # Use wrapped LLM

def get_search_service_dep(): # Renamed to get_search_service_dep
    return search_service # Return SearchService

def get_rag_pipeline_dep():
    return rag_pipeline
