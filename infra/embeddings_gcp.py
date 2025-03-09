# embeddings_gcp.py
import logging
import gc
from google.cloud import storage, secretmanager, bigquery
from sqlalchemy import create_engine, text
import torch
import gcsfs
import psycopg2
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
PROJECT_ID = os.environ.get("PROJECT_ID")
BUCKET_NAME = os.environ.get("BUCKET_NAME")
CLOUD_SQL_CONNECTION_NAME = os.environ.get("CLOUD_SQL_CONNECTION_NAME")
DATABASE_NAME = os.environ.get("DATABASE_NAME")
DATASET_ID = os.environ.get("DATASET_ID", "amazon_dataset") # Default dataset ID if not set in env
class BigQueryPipeline:
    def __init__(self):
        # Initialize BigQuery and Storage clients
        self.project_id = PROJECT_ID
        self.bq_client = bigquery.Client(project=self.project_id)
        self.storage_client = storage.Client(project=self.project_id)
        self.dataset_id = DATASET_ID

    def load_parquet_to_bigquery(self, category):
        """
        Loads all Parquet files for a given category from the GCS bucket into a BigQuery table.
        """
        table_name = f"{self.dataset_id}.processed_amazon_reviews_{category}"
        bucket_name = BUCKET_NAME # Use bucket name from env variable
        uri = f"gs://{bucket_name}/processed_amazon_reviews/{category}/*.parquet"
        
        job_config = bigquery.LoadJobConfig(
            source_format=bigquery.SourceFormat.PARQUET,
            write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
        )
        
        logger.info(f"Starting load job for category {category}: {uri} -> {table_name}")
        load_job = self.bq_client.load_table_from_uri(uri, table_name, job_config=job_config)
        load_job.result()  # Wait for job to complete.
        logger.info(f"Completed load job: Data loaded into {table_name}")
        return table_name

    def compute_embeddings(self, source_table):
        """
        Runs a BigQuery SQL query that computes embeddings using a UDF or ML model.
        (Note: Replace 'my_embedding_udf' with your actual embedding function/model.)
        """
        embedding_table = f"{source_table}_embeddings"
        query = f"""
        CREATE OR REPLACE TABLE `{embedding_table}` AS
        SELECT 
            asin,
            main_category,
            product_title,
            cleaned_item_description,
            average_rating,
            rating_number AS rating_count,
            ML.FEATURE_VECTORIZE(STRUCT(cleaned_item_description), feature_columns=['cleaned_item_description'], method='TF_IDF') AS embedding 
        FROM `{source_table}`
        """
        logger.info(f"Starting embedding computation for table {source_table}")
        query_job = self.bq_client.query(query)
        query_job.result()  # Wait for query to complete.
        logger.info(f"Embeddings computed and stored in {embedding_table}")
        return embedding_table

    def process_category(self, category):
        """
        Process a category: load its Parquet files into BigQuery and then compute embeddings.
        """
        source_table = self.load_parquet_to_bigquery(category)
        embeddings_table = self.compute_embeddings(source_table)
        return embeddings_table

if __name__ == "__main__":
    pipeline = BigQueryPipeline()
    categories = ["All_Beauty", "Software", "Baby_Products"]
    
    for category in categories:
        try:
            result_table = pipeline.process_category(category)
            logger.info(f"Completed processing for category {category}. Embeddings stored in: {result_table}")
        except Exception as e:
            logger.error(f"Error processing category {category}: {e}")
            raise