import os

# Google Cloud Project ID
PROJECT_ID = os.environ.get("PROJECT_ID")

# Vertex AI Region
VERTEX_AI_REGION = os.environ.get("VERTEX_AI_REGION", "us-central1")

# BigQuery Dataset ID
BIGQUERY_DATASET_ID = os.environ.get("BIGQUERY_DATASET_ID")

# BigQuery Table ID for products
BIGQUERY_PRODUCT_TABLE = os.environ.get("BIGQUERY_PRODUCT_TABLE", "product_embeddings") # Updated default
# BigQuery Table ID for reviews
BIGQUERY_REVIEW_TABLE = os.environ.get("BIGQUERY_REVIEW_TABLE", "review_embeddings") # Updated default

# LLM Model Name (Vertex AI PaLM or Gemini)
LLM_MODEL_NAME = os.environ.get("LLM_MODEL_NAME", "gemini-pro") # Added default value "gemini-pro"

# Optional: Sentiment Analysis Model Name (Vertex AI or other)
SENTIMENT_MODEL_NAME = os.environ.get("SENTIMENT_MODEL_NAME")

# Path to Google Application Credentials JSON file
GOOGLE_APPLICATION_CREDENTIALS_PATH = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") # New variable
