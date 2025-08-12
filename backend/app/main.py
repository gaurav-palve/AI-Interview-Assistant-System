from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import json
from .routes import auth_routes, interview_routes, upload_resume, generate_mcq_route, email_routes
from .database import connect_to_mongo, close_mongo_connection
from .utils.logger import get_logger

# Get logger for this module
logger = get_logger(__name__)

app = FastAPI(title="AI Interview Assistant Backend")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8501", "http://127.0.0.1:8501",  # Streamlit default ports
        "http://localhost:5173", "http://127.0.0.1:5173",  # Vite default ports
        "http://localhost:3000", "http://127.0.0.1:3000",  # React default ports
        "http://localhost:8000", "http://127.0.0.1:8000",  # Backend API ports (for testing)
        "http://localhost:5000", "http://127.0.0.1:5000",  # Flask default ports
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth_routes.router)
app.include_router(interview_routes.router)
app.include_router(upload_resume.router)
app.include_router(generate_mcq_route.router)
app.include_router(email_routes.router)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    
    # Log request body for debugging
    try:
        body = await request.body()
        if body:
            try:
                # Try to parse as JSON for better logging
                body_str = body.decode()
                if body_str:
                    try:
                        body_json = json.loads(body_str)
                        logger.info(f"Request body (JSON): {body_json}")
                    except:
                        # If not JSON, log as string
                        logger.info(f"Request body: {body_str}")
            except:
                logger.info("Request body: [binary data]")
    except Exception as e:
        logger.error(f"Error reading request body: {e}")
    
    # Process the request and get the response
    response = await call_next(request)
    
    # Log response status
    logger.info(f"Response status: {response.status_code}")
    
    return response

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up AI Interview Assistant Backend...")
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down AI Interview Assistant Backend...")
    await close_mongo_connection()

@app.get("/")
async def root():
    return {"message": "AI Interview Assistant Backend is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
