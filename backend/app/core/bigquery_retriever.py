# app/core/bigquery_retriever.py
from langchain.schema import BaseRetriever, Document
from typing import List
from backend.app.core.search_engine import SearchEngine

class BigQueryRetriever(BaseRetriever):
    def __init__(self, search_engine: SearchEngine):
        self.search_engine = search_engine
        
    async def _aget_relevant_documents(self, query: str, **kwargs) -> List[Document]:
        results = await self.search_engine.hybrid_search(query)
        docs = []
        for product in results:
            doc_content = f"Product: {product['product_content']}\nReviews:\n"
            doc_content += "\n".join([rev["review_content"] for rev in product["reviews"]])
            docs.append(Document(page_content=doc_content))
        return docs