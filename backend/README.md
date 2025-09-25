# Product Search and Recommendation API

## Overview

This API provides semantic product search and context-aware recommendations based on Amazon reviews data. 

## Project Structure

```
search_api_project/
├── app/
│   ├── api/          
│   ├── core/         
│   ├── llm/           
│   ├── db/            
│   ├── utils/         
│   ├── config.py     
│   ├── main.py       
│   └── __init__.py
├── tests/          
├── Dockerfile       
├── requirements.txt 
├── README.md        
└── .gitignore       
```

Refer to `cline_docs/productContext.md` for a detailed description of the project structure and components.

## Setup

1.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
2.  **Configure Environment Variables:**
    *   Set the following environment variables:
        *   `PROJECT_ID`: Your Google Cloud Project ID
        *   `VERTEX_AI_REGION`:  Vertex AI region (e.g., "us-central1")
        *   `BIGQUERY_DATASET_ID`: BigQuery dataset ID
    *   Optionally, set:
        *   `BIGQUERY_PRODUCT_TABLE`: BigQuery table for products (default: "products")
        *   `BIGQUERY_REVIEW_TABLE`: BigQuery table for reviews (default: "reviews")
        *   `LLM_MODEL_NAME`: Vertex AI LLM model name (default: "gemini-pro")
        *   `SENTIMENT_MODEL_NAME`: Sentiment analysis model name (optional)
        *   `RAG_BATCHING_ENABLED`: Enable batched LLM calls (default: `true`)
        *   `RAG_BATCH_SIZE`: Number of products per LLM request when batching (default: `3`)
        *   `RAG_MAX_PROMPT_TOKENS`: Soft cap for prompt token estimation per batch (default: `5500`)
        *   `RAG_MAX_REVIEW_CHARS`: Maximum characters per review included in prompts (default: `600`)

## Batched LLM summaries

The RAG pipeline now issues batched prompts to the LLM and validates responses with LangChain's `PydanticOutputParser`. Products are chunked according to the configured batch size and token budget. If the parser reports invalid JSON, the pipeline retries with stricter instructions before falling back to per-product generation. Structured analyses are attached to `/search` responses under the `analysis` field.

## Run Locally

```bash
cd search_api_project
uvicorn app.main:app --reload
```

## Deploy to Cloud Run

(Instructions for deploying to Google Cloud Run will be added later)