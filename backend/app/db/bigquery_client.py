from google.cloud import bigquery
import asyncio
import logging
from typing import List

logger = logging.getLogger(__name__)


class BigQueryClient:
    def __init__(self):
        # Lazy client creation inside methods to avoid import-time credential errors
        self._client = None

    def _get_client(self) -> bigquery.Client:
        if self._client is None:
            self._client = bigquery.Client()
        return self._client

    async def execute_query(self, query: str, timeout: int = 30, retries: int = 2) -> List[dict]:
        """Execute a BigQuery SQL query in a threadpool with timeout and simple retry/backoff.

        Args:
            query: SQL query string.
            timeout: seconds to wait per blocking call before timing out.
            retries: number of attempts before giving up.

        Returns:
            List of rows as dicts.
        """
        attempt = 0
        backoff_base = 1
        # allow at most one retry by default (attempts = retries)
        while True:
            attempt += 1
            try:
                client = self._get_client()
                # Run the blocking client.query in a thread
                query_job = await asyncio.wait_for(asyncio.to_thread(client.query, query), timeout=timeout)
                # Fetch results (blocking) in thread
                rows = await asyncio.wait_for(asyncio.to_thread(query_job.result), timeout=timeout)

                # Convert RowIterator to list of dicts
                return [dict(row) for row in rows]
            except asyncio.TimeoutError:
                logger.warning("BigQuery execute_query attempt %s timed out", attempt)
                if attempt >= retries:
                    raise
            except Exception as e:
                logger.exception("BigQuery execute_query attempt %s failed: %s", attempt, str(e))
                if attempt >= retries:
                    raise

            # simple exponential backoff before retrying
            await asyncio.sleep(backoff_base * (2 ** (attempt - 1)))