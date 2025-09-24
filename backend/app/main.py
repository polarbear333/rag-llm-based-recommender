from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware  
from backend.app.dependencies import get_search_service_dep, get_rag_pipeline_dep, initialize_on_startup  # Changed to absolute import
from backend.app.api import search_endpoints, sentiment_endpoints
import logging
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


# Include routers, passing dependencies - CORRECTED: Pass dependencies as router arguments
app.include_router(search_endpoints.router, dependencies=[Depends(get_search_service_dep), Depends(get_rag_pipeline_dep)])
app.include_router(sentiment_endpoints.router, dependencies=[Depends(get_rag_pipeline_dep)]) # Add dependencies to sentiment_endpoints as well (if needed in the future)

@app.get("/")
async def read_root():
    return {"message": "Product Search and Recommendation API"}

@app.on_event("startup")
async def startup_event():
    logging.info("Application starting up, checking dependencies...")
    try:
        # initialize heavy clients in background to detect configuration errors early
        await initialize_on_startup()
        # also ensure core services can be constructed
        _ = get_search_service_dep()
        _ = get_rag_pipeline_dep()
        logging.info("Dependencies initialized successfully")
    except Exception as e:
        logging.error(f"Failed to initialize dependencies: {str(e)}")