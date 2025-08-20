import os
from typing import Optional
from langchain_openai import ChatOpenAI
from app.config import settings 
import logging

logger = logging.getLogger(__name__)

def get_openai_llm(
    api_key: Optional[str] = None,
    model: str = "gpt-4o-mini",
    temperature: float = 0.3,
):
    try:
        key = api_key or settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
        if not key:
            raise ValueError("OpenAI API key not found. Please set OPENAI_API_KEY in .env or config.py")
        
        llm = ChatOpenAI(
            model=model,
            api_key=key,
            temperature=temperature,
        )

        return llm
    except Exception as e:
        logger.exception(f"Error initializing OpenAI LLM: {e}")
        raise
