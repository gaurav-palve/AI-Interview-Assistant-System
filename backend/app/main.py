from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json
from .routes import auth_routes, interview_routes, upload_resume, generate_mcq_route, email_routes, candidate_routes, camera_integration_route, resume_screening_route
from .database import connect_to_mongo, close_mongo_connection
import asyncio

from .routes import (
    auth_routes,
    interview_routes,
    upload_resume,
    generate_mcq_route,
    email_routes,
    candidate_routes,
    voice_interview_routes,
    websocket_routes,
    resume_screening_route,
)
from .database import connect_to_mongo, close_mongo_connection, verify_database_connection
from .utils.logger import get_logger
from .utils.websocket_manager import set_event_loop

logger = get_logger(__name__)


# Define lifespan handler (replaces @app.on_event)
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up AI Interview Assistant Backend...")

    try:
        # Set up WebSocket event loop for broadcasting
        loop = asyncio.get_event_loop()
        set_event_loop(loop)
        logger.info(" WebSocket event loop configured")

        # Connect to MongoDB
        await connect_to_mongo()

        # Verify database connection
        db_ok = await verify_database_connection()
        if db_ok:
            logger.info(" Database connection and collections verified successfully")
        else:
            logger.error(" Database verification failed - some features may not work correctly")

    except Exception as e:
        logger.error(f" Error during startup: {e}")
        logger.error("Application may not function correctly due to startup errors")

    # Yield control to the application
    yield

    # Shutdown logic
    logger.info("Shutting down AI Interview Assistant Backend...")
    await close_mongo_connection()


# Create FastAPI app with lifespan
app = FastAPI(title="AI Interview Assistant Backend", lifespan=lifespan)


# Add CORS middleware with permissive settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (debugging, restrict in prod)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Register routes
app.include_router(auth_routes.router)
app.include_router(interview_routes.router)
app.include_router(upload_resume.router)
app.include_router(generate_mcq_route.router)
app.include_router(email_routes.router)
app.include_router(candidate_routes.router)
app.include_router(camera_integration_route.router)



# Add a middleware to ensure CORS headers are present in all responses
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f" Request: {request.method} {request.url}")

    try:
        body = await request.body()
        if body:
            try:
                body_str = body.decode()
                if body_str:
                    try:
                        body_json = json.loads(body_str)
                        logger.info(f" Request body (JSON): {body_json}")
                    except Exception:
                        logger.info(f" Request body (raw): {body_str}")
            except Exception:
                logger.info(" Request body: [binary data]")
    except Exception as e:
        logger.error(f" Error reading request body: {e}")

    response = await call_next(request)
    logger.info(f" Response status: {response.status_code}")
    return response


# Register routers
app.include_router(auth_routes.router)
app.include_router(interview_routes.router)
app.include_router(upload_resume.router)
app.include_router(generate_mcq_route.router)
app.include_router(email_routes.router)
app.include_router(candidate_routes.router)
app.include_router(voice_interview_routes.router)
app.include_router(websocket_routes.router)
app.include_router(resume_screening_route.router)


# Health endpoints
# @app.get("/")
# async def root():
#     return {"message": "AI Interview Assistant Backend is running!"}


# @app.get("/health")
# async def health_check():
#     return {"status": "healthy"}
