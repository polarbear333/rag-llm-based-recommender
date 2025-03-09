from google.cloud import bigquery
from backend.app.config import PROJECT_ID

class BigQueryClient:
    async def execute_query(self, query: str) -> list:
        client = bigquery.Client()
        query_job = client.query(query)
        
        # Convert RowIterator to list of dicts
        results = []
        for row in query_job.result():
            results.append(dict(row))
            
        return results