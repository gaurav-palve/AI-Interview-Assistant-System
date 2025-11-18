import os
import sys
import json
import asyncio
import warnings
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.services.auth_service import verify_token_from_query_or_header


# Suppress warnings globally
warnings.filterwarnings("ignore")

# Local imports
from app.database import (
    connect_to_mongo,
    close_mongo_connection,
    verify_database_connection,
)
from app.utils.logger import get_logger
from app.utils.websocket_manager import set_event_loop
from app.services.auth_service import verify_token_from_query_or_header, get_token_from_request

# Import all route modules
from app.routes import (
    auth_routes,
    interview_routes,
    upload_resume,
    generate_mcq_route,
    email_routes,
    candidate_routes,
    camera_integration_route,
    voice_interview_routes,
    websocket_routes,
    resume_screening_route,
    generate_jd_route,
    job_posting_route,
    interview_scheduling_route,
    code,
    questions,
    skills_suggestion_routes,
    forgot_password_routes,
    reset_password_routes,
    report_generation_route,
    skills_suggestion_routes
)

# Initialize logger
logger = get_logger(__name__)


# ------------------------------------------------------------------------------
# Lifespan handler (startup + shutdown)
# ------------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up AI Interview Assistant Backend...")

    try:
        # Configure WebSocket event loop
        loop = asyncio.get_event_loop()
        set_event_loop(loop)
        logger.info("WebSocket event loop configured")

        # Connect to MongoDB
        await connect_to_mongo()

        # Verify MongoDB connection
        if await verify_database_connection():
            logger.info("Database connection verified successfully")
        else:
            logger.warning("Database verification failed. Some features may not work.")
    except Exception as e:
        logger.exception(f"Error during startup: {e}")

    yield  # Run the application

    # Shutdown tasks
    logger.info("Shutting down AI Interview Assistant Backend...")
    await close_mongo_connection()
    logger.info("MongoDB connection closed.")


# ------------------------------------------------------------------------------
# FastAPI app configuration
# ------------------------------------------------------------------------------
app = FastAPI(
    title="AI Interview Assistant Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# ------------------------------------------------------------------------------
# CORS Middleware
# ------------------------------------------------------------------------------
# Get frontend URL from environment variables for CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],  # Restrict to specific origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Explicit methods
    allow_headers=["Authorization", "Content-Type", "Accept"],  # Explicit headers
    expose_headers=["Authorization"],  # Only expose necessary headers
    max_age=600,
)

# ------------------------------------------------------------------------------
# Request Logging Middleware
# ------------------------------------------------------------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url}")

    try:
        body = await request.body()
        if body:
            try:
                body_json = json.loads(body.decode())
                logger.debug(f"Request Body: {body_json}")
            except Exception:
                logger.debug(f"Request Body (raw): {body.decode(errors='ignore')}")
    except Exception as e:
        logger.error(f"Error reading request body: {e}")

    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response


# Register routers
app.include_router(auth_routes.router, prefix="/api/auth")
app.include_router(interview_routes.router, prefix="/api/interviews")
app.include_router(upload_resume.router, prefix="/api/interviews/resume")
app.include_router(generate_mcq_route.router, prefix="/api/interviews/mcq")
app.include_router(email_routes.router, prefix="/api/emails")
app.include_router(candidate_routes.router, prefix="/api/candidate")
app.include_router(voice_interview_routes.router, prefix="/api/voice-interviews")
app.include_router(websocket_routes.router, prefix="/api/ws")
app.include_router(resume_screening_route.router, prefix="/api/screening")
app.include_router(camera_integration_route.router, prefix="/api/camera")
app.include_router(generate_jd_route.router, prefix="/api/job-descriptions")
app.include_router(job_posting_route.router, prefix="/api/job-postings")
app.include_router(interview_scheduling_route.router, prefix="/api/bulk-interviews")
app.include_router(skills_suggestion_routes.router, prefix="/api")
app.include_router(report_generation_route.router, prefix="/api/reports")
app.include_router(code.router, prefix="/api/code", tags=["code"])
app.include_router(questions.router, prefix="/api/questions", tags=["questions"])
app.include_router(forgot_password_routes.router, prefix="/api")
app.include_router(reset_password_routes.router, prefix="/api")

logger.info("All routes registered successfully.")


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "AI Interview Assistant Backend running smoothly"}
