# Dockerfile
FROM python:3.10-slim

# Install GPU dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir

COPY embeddings_gcp.py .

ENTRYPOINT ["python", "embeddings_gcp.py"]