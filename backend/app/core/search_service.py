# app/core/search_service.py
from typing import List, Dict, Any
from backend.app.core.search_engine import SearchEngine
import logging

logger = logging.getLogger(__name__)
class SearchService:
    def __init__(self, search_engine: SearchEngine):
        self.search_engine = search_engine

    async def search_products(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Entry point for product search workflow"""
        logger.info(f"Starting search for: '{query}'")
        
        try:
            results = await self.search_engine.hybrid_search(
                query, 
                products_k=top_k,
                reviews_per_product=3
            )
        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            raise
            
        logger.info(f"Found {len(results)} products for '{query}'")
        return results


