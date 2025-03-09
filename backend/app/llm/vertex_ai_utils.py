import vertexai 
from vertexai.generative_models import GenerativeModel
from vertexai.language_models import TextEmbeddingModel
from google.oauth2 import service_account # Import service_account
from backend.app.config import PROJECT_ID, VERTEX_AI_REGION, LLM_MODEL_NAME, GOOGLE_APPLICATION_CREDENTIALS_PATH # Import GOOGLE_APPLICATION_CREDENTIALS_PATH

class VertexAIClient:
    def __init__(self):
        credentials = service_account.Credentials.from_service_account_file(GOOGLE_APPLICATION_CREDENTIALS_PATH) # Load credentials from file
        vertexai.init(
            project=PROJECT_ID,
            location=VERTEX_AI_REGION,
            credentials=credentials # Use credentials argument for authentication
        )
        self.llm_model = GenerativeModel(LLM_MODEL_NAME) # Use GenerativeModel from vertexai.generative_models
        # Initialize embedding model
        self.embedding_model = TextEmbeddingModel.from_pretrained("text-embedding-005") # or another suitable model


    async def generate_text(self, prompt: str):
        response = self.llm_model.generate_content(prompt)
        return response.text

    async def get_embeddings(self, text: str):
        embeddings = self.embedding_model.get_embeddings([text])
        return [embedding.values for embedding in embeddings][0] # Return the embedding vector