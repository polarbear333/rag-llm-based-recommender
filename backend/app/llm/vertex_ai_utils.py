import asyncio
import logging
import vertexai
from vertexai.generative_models import GenerativeModel
from vertexai.language_models import TextEmbeddingModel
from google.oauth2 import service_account
from backend.app.config import PROJECT_ID, VERTEX_AI_REGION, LLM_MODEL_NAME, GOOGLE_APPLICATION_CREDENTIALS_PATH
from typing import List

logger = logging.getLogger(__name__)


class VertexAIClient:
    """Wrapper around Vertex AI SDK that keeps initialization lazy and exposes async-safe methods.

    The underlying Vertex SDK is typically synchronous, so blocking calls are executed
    in a thread using asyncio.to_thread. Timeouts and simple retries are supported.
    """

    def __init__(self):
        self._initialized = False
        self._llm_model = None
        self._embedding_model = None

    def _init(self):
        if self._initialized:
            return
        if not GOOGLE_APPLICATION_CREDENTIALS_PATH:
            raise RuntimeError("GOOGLE_APPLICATION_CREDENTIALS_PATH is not set")
        # Security check: warn if credentials file looks like it lives inside the project directory
        try:
            import os
            repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
            creds_abs = os.path.abspath(GOOGLE_APPLICATION_CREDENTIALS_PATH)
            if creds_abs.startswith(repo_root):
                logger.warning("GOOGLE_APPLICATION_CREDENTIALS_PATH appears inside the repo. Ensure this file is not committed to VCS and is secured.")
        except Exception:
            pass
        credentials = service_account.Credentials.from_service_account_file(GOOGLE_APPLICATION_CREDENTIALS_PATH)
        vertexai.init(project=PROJECT_ID, location=VERTEX_AI_REGION, credentials=credentials)
        self._llm_model = GenerativeModel(LLM_MODEL_NAME)
        self._embedding_model = TextEmbeddingModel.from_pretrained("text-embedding-005")
        self._initialized = True

    async def generate_text(self, prompt: str, timeout: int = 30, retries: int = 2) -> str:
        attempt = 0
        while True:
            attempt += 1
            try:
                # ensure underlying models are initialized in a thread to avoid blocking event loop
                await asyncio.to_thread(self._init)
                # call the blocking generate_content in thread
                response = await asyncio.wait_for(asyncio.to_thread(self._llm_model.generate_content, prompt), timeout=timeout)
                return response.text
            except asyncio.TimeoutError:
                logger.warning("VertexAI generate_text attempt %s timed out", attempt)
                if attempt >= retries:
                    raise
            except Exception as e:
                logger.exception("VertexAI generate_text attempt %s failed: %s", attempt, str(e))
                if attempt >= retries:
                    raise
            await asyncio.sleep(1 * attempt)

    async def get_embeddings(self, text: str, timeout: int = 30, retries: int = 2) -> List[float]:
        attempt = 0
        while True:
            attempt += 1
            try:
                await asyncio.to_thread(self._init)
                embeddings = await asyncio.wait_for(asyncio.to_thread(self._embedding_model.get_embeddings, [text]), timeout=timeout)
                # embeddings is a list-like of Embedding objects
                return [embedding.values for embedding in embeddings][0]
            except asyncio.TimeoutError:
                logger.warning("VertexAI get_embeddings attempt %s timed out", attempt)
                if attempt >= retries:
                    raise
            except Exception as e:
                logger.exception("VertexAI get_embeddings attempt %s failed: %s", attempt, str(e))
                if attempt >= retries:
                    raise
            await asyncio.sleep(1 * attempt)