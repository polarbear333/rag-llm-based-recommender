# app/api/search_endpoints.py
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from backend.app.core.search_service import SearchService # Changed to absolute import
from backend.app.core.rag_pipeline import RAGPipeline # Changed to absolute import
from backend.app.dependencies import get_search_service_dep, get_rag_pipeline_dep # Updated dependency import
from backend.app.core.search_engine import SearchEngine
import logging, asyncio

router = APIRouter()
logger = logging.getLogger(__name__)

# app/api/search_endpoints.py
@router.get("/search")
async def hybrid_search(
    query: str,
    products_k: int = 3,
    search_service: SearchService = Depends(get_search_service_dep),
    rag_pipeline: RAGPipeline = Depends(get_rag_pipeline_dep),
):
    logger.info("Entering hybrid_search endpoint")  # Added log statement
    try:
        async def generate_product_explanation(product):
            explanation = await rag_pipeline.generate_explanation(
                query,
                {
                    "product_title": product['product_title'],
                    "cleaned_item_description": product['cleaned_item_description'],
                    "product_categories": product['product_categories']
                },
                product['reviews']
            )
            product['explanation'] = explanation
            return product
        
        search_results = await search_service.search_products(query, products_k)
        explained_results = await asyncio.gather(*[generate_product_explanation(product) for product in search_results])

        return {
            "query": query,
            "count": len(search_results),  
            "results": search_results,
            "explain_count": len(explained_results),
            "explanation": explained_results
        }
    except Exception as e:
        logger.error(f"API error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))