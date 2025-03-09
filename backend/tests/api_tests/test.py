from app.db.bigquery_client import BigQueryClient

async def test_bq():
    client = BigQueryClient()
    results = await client.execute_query("SELECT 'test' AS field")
    print(type(results))  # Should show <class 'list'>
    print(results)  # Should show [{'field': 'test'}]