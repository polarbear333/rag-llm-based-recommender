import os

# Google Cloud Project ID
PROJECT_ID = os.environ.get("PROJECT_ID")

# Vertex AI Region
VERTEX_AI_REGION = os.environ.get("VERTEX_AI_REGION", "us-central1")

# BigQuery Dataset ID
BIGQUERY_DATASET_ID = os.environ.get("BIGQUERY_DATASET_ID")

# BigQuery Table ID for products
BIGQUERY_PRODUCT_TABLE = os.environ.get("BIGQUERY_PRODUCT_TABLE", "product_embeddings") 
# BigQuery Table ID for reviews
BIGQUERY_REVIEW_TABLE = os.environ.get("BIGQUERY_REVIEW_TABLE", "review_embeddings") 

# LLM Model Name (Vertex AI PaLM or Gemini)
LLM_MODEL_NAME = os.environ.get("LLM_MODEL_NAME", "gemini-2.0-flash-lite") 

# Optional: Sentiment Analysis Model Name (Vertex AI or other)
SENTIMENT_MODEL_NAME = os.environ.get("SENTIMENT_MODEL_NAME")

# Path to Google Application Credentials JSON file
GOOGLE_APPLICATION_CREDENTIALS_PATH = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") 


def _get_bool_env(name: str, default: bool) -> bool:
	raw = os.environ.get(name)
	if raw is None:
		return default
	return raw.strip().lower() in {"1", "true", "yes", "on"}


def _get_int_env(name: str, default: int) -> int:
	raw = os.environ.get(name)
	if raw is None:
		return default
	try:
		return int(raw)
	except ValueError:
		return default


# RAG batching / prompt configuration
RAG_BATCHING_ENABLED = _get_bool_env("RAG_BATCHING_ENABLED", True)
RAG_BATCH_SIZE = _get_int_env("RAG_BATCH_SIZE", 3)
RAG_MAX_PROMPT_TOKENS = _get_int_env("RAG_MAX_PROMPT_TOKENS", 65536)
RAG_MAX_REVIEW_CHARS = _get_int_env("RAG_MAX_REVIEW_CHARS", 4000)
