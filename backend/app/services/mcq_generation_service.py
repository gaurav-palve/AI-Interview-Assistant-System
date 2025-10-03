from ..llm_models.openai_llm import get_openai_llm
from ..llm_models.gemini_llm import get_gemini_llm
from langchain.prompts import PromptTemplate
from langchain_core.messages import HumanMessage
import logging
from ..config import settings
import os
import asyncio
import hashlib
import time
from functools import lru_cache
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# LRU cache for MCQ results
mcq_cache: Dict[str, Dict[str, Any]] = {}
CACHE_EXPIRY = 3600  # 1 hour in seconds

def get_cache_key(jd_text: str, resume_text: str) -> str:
    """Generate a cache key based on the input texts"""
    # Create a hash of the combined texts to use as a cache key
    combined = f"{jd_text}|{resume_text}"
    return hashlib.md5(combined.encode()).hexdigest()

def get_cached_mcqs(cache_key: str) -> Optional[str]:
    """Get MCQs from cache if available and not expired"""
    current_time = time.time()
    if cache_key in mcq_cache:
        cache_entry = mcq_cache[cache_key]
        if current_time - cache_entry["timestamp"] < CACHE_EXPIRY:
            logger.info(f"Cache hit for key {cache_key[:8]}...")
            return cache_entry["data"]
    return None

def cache_mcqs(cache_key: str, content: str) -> None:
    """Cache MCQs for future use"""
    mcq_cache[cache_key] = {
        "data": content,
        "timestamp": time.time()
    }
    logger.info(f"Cached MCQs with key {cache_key[:8]}...")
    
    # Cleanup old cache entries if cache gets too large
    if len(mcq_cache) > 100:
        # Remove oldest entries
        oldest_keys = sorted(mcq_cache.keys(), 
                            key=lambda k: mcq_cache[k]["timestamp"])[:20]
        for key in oldest_keys:
            del mcq_cache[key]

async def generate_mcqs(jd_text: str, resume_text: str) -> str:
    """
    Generate 10 MCQs: 5 mathematical aptitude and reasoning questions and 5 technical questions based on job description and resume.
    The mathematical questions cover topics like boats & streams, finding next number, time & distance, and probability.
    Returns: String of formatted MCQs
    
    Features:
    - Caching to prevent duplicate generation
    - Timeout protection to prevent hanging requests
    - Improved error handling
    """
    # Generate cache key
    cache_key = get_cache_key(jd_text, resume_text)
    
    # Check cache first
    cached_result = get_cached_mcqs(cache_key)
    if cached_result:
        return cached_result
    
    try:
        # Escape braces inside JSON example
        template = """
You are an expert interviewer.
Your task is to create exactly 10 medium-level multiple-choice questions:
- 5 mathematical aptitude questions (questions 1-5)
- 5 technical questions based on the job description and resume (questions 6-10)

Rules for Mathematical Aptitude Questions (1-5):
1. Create one question on each of these topics:
   - Boats and streams
   - Finding the next number in a sequence
   - Time and distance
   - Probability
   - work and time
   - Any other mathematical topic
2. Difficulty level should be medium (7/10) - challenging but solvable
3. Each question should be unique and test different skills
4. Questions should be practical and applicable

Rules for Technical Questions (6-10):
1. Questions must be technical and based ONLY on:
   - Skills explicitly mentioned in the job description
   - Skills explicitly mentioned in the candidate's resume
2. Do NOT mention "resume", "job description", or the candidate's name in the question text.
3. Focus on practical, applied knowledge, not definitions.

General Rules:
1. Each question should be short, precise, and answerable in less than 20 seconds.
2. Format strictly as:
<question_number>. <question text>
a) <option 1>
b) <option 2>
c) <option 3>
d) <option 4>
Answer: <correct option letter>) <correct option text>

Job Description:
{jd}

Resume:
{resume}

Example Mathematical Question:
1. A boat travels 24 km upstream in 6 hours and the same distance downstream in 4 hours. What is the speed of the boat in still water?
a) 3 km/h
b) 4 km/h
c) 5 km/h
d) 6 km/h
Answer: d) 6 km/h

Example Technical Question:
6. Which HTTP method is idempotent and used for updating existing resources in a REST API?
a) POST
b) PUT
c) PATCH
d) DELETE
Answer: b) PUT
"""

        prompt = PromptTemplate(
            input_variables=["jd", "resume"],
            template=template
        )

        formatted_prompt = prompt.format(jd=jd_text, resume=resume_text)
        
        # Add timeout protection
        try:
            # Use Gemini LLM
            llm = get_openai_llm()
            
            # Add timeout to prevent hanging requests
            response = await asyncio.wait_for(
                llm.ainvoke([HumanMessage(content=formatted_prompt)]),
                timeout=45.0  # 45 second timeout
            )
            
            # Cache the successful result
            result = response.content
            if result:
                cache_mcqs(cache_key, result)
                logger.info("MCQ generation successful with Gemini.")
                return result
            else:
                raise ValueError("Empty response from LLM")
                
        except asyncio.TimeoutError:
            logger.error("MCQ generation timed out after 45 seconds")
            raise Exception("MCQ generation timed out. Please try again later.")

    except Exception as e:
        logger.error(f"Error generating MCQs: {e}")
        # Return a more helpful error message
        error_msg = str(e)
        if "timeout" in error_msg.lower():
            return "The MCQ generation process timed out. This could be due to high server load. Please try again in a few moments."
        return f"Error generating MCQs: {error_msg}"
