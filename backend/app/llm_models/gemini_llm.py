import os
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings  # Use the loaded settings instance
import logging

logger = logging.getLogger(__name__)

def get_gemini_llm():
    try:
        api_key = settings.GOOGLE_API_KEY or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("Google API key not found. Please set GOOGLE_API_KEY in .env or config.py")

        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0.3,
            google_api_key=api_key
        )
        return llm
    except Exception as e:
        logger.exception(f"Error initializing Gemini LLM: {e}")
        raise
