# app/api/search_endpoints.py
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from backend.app.core.search_service import SearchService  # Changed to absolute import
from backend.app.core.rag_pipeline import RAGPipeline  # Changed to absolute import
from backend.app.dependencies import get_search_service_dep, get_rag_pipeline_dep  # Updated dependency import
from backend.app.schemas.llm_outputs import ProductAnalysis
from backend.app.schemas.search import ProductReview, ProductSearchResult, SearchResponse
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# app/api/search_endpoints.py
@router.get("/search", response_model=SearchResponse)
async def hybrid_search(
    query: str,
    products_k: int = 3,
    search_service: SearchService = Depends(get_search_service_dep),
    rag_pipeline: RAGPipeline = Depends(get_rag_pipeline_dep),
):
    logger.info("Entering hybrid_search endpoint")  # Added log statement
    try:
        search_results = await search_service.search_products(query, products_k)
        analyses = await rag_pipeline.generate_batch_explanations(query, search_results)
        analysis_map: Dict[str, ProductAnalysis] = {
            analysis.asin: analysis for analysis in analyses if analysis.asin
        }

        response_items: List[ProductSearchResult] = []
        for product in search_results:
            asin = product.get("asin") or "unknown"
            reviews_payload = [
                ProductReview(
                    content=review.get("content", ""),
                    rating=review.get("rating"),
                    verified_purchase=review.get("verified_purchase"),
                    user_id=review.get("user_id"),
                    timestamp=review.get("timestamp"),
                    similarity=review.get("similarity"),
                    has_rating=review.get("has_rating"),
                )
                for review in product.get("reviews", [])
            ]

            response_items.append(
                ProductSearchResult(
                    asin=asin,
                    product_title=product.get("product_title", ""),
                    cleaned_item_description=product.get("cleaned_item_description", ""),
                    product_categories=product.get("product_categories", ""),
                    similarity=product.get("similarity"),
                    avg_rating=product.get("avg_rating"),
                    rating_count=product.get("rating_count"),
                    displayed_rating=product.get("displayed_rating"),
                    combined_score=product.get("combined_score"),
                    reviews=reviews_payload,
                    analysis=analysis_map.get(asin),
                )
            )

        return SearchResponse(query=query, count=len(response_items), results=response_items)
    except Exception as e:
        logger.error(f"API error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    

# Add this to search_endpoints.py
@router.get("/test")
async def test_endpoint():
    logger.info("Test endpoint called")
    return {"status": "ok", "message": "API is responding correctly"}