from ..llm_models.openai_llm import get_openai_llm
from ..llm_models.gemini_llm import get_gemini_llm
from langchain.prompts import PromptTemplate
from langchain_core.messages import HumanMessage
import logging
from ..config import settings
import os
import asyncio
import time
import random
from typing import Dict, Any

logger = logging.getLogger(__name__)


async def generate_mcqs(jd_text: str, resume_text: str) -> str:
    """
    Generate 10 MCQs: 5 mathematical aptitude and reasoning questions and 5 technical questions based on job description and resume.
    The mathematical questions cover topics like boats & streams, finding next number, time & distance, and probability.
    Returns: String of formatted MCQs
    
    Features:
    - Generates new MCQs each time
    - Timeout protection to prevent hanging requests
    - Improved error handling
    """
    try:
        # Escape braces inside JSON example
        template = """
        You are an expert interviewer.
        Your task is to create exactly 10 medium-level multiple-choice questions:
        - 5 mathematical aptitude questions (questions 1-5)
        - 5 technical questions based on the job description and resume (questions 6-10)
        
        Rules for Mathematical Aptitude Questions (1-5):
        1. Create questions on any 5 DIFFERENT *mathematical aptitude* topics.
        2. IMPORTANT: Each time this prompt is run, select a DIFFERENT set of 5 topics from the list above
        3. Difficulty level should be medium (7/10) - challenging but solvable
        4. Each question should be unique and test different skills
        5. Questions should be practical and applicable
        6. Vary the question formats, numbers, and scenarios to ensure diversity
        
        Rules for Technical Questions (6-10):
        1. Questions must be technical and based ONLY on:
           - Skills explicitly mentioned in the job description
           - Skills explicitly mentioned in the candidate's resume
        2. IMPORTANT: Each time this prompt is run, focus on DIFFERENT technical skills or aspects
        3. Do NOT mention "resume", "job description", or the candidate's name in the question text.
        4. Focus on practical, applied knowledge, not definitions.
        5. Vary the question formats, scenarios, and technical concepts to ensure diversity
        6. Cover different aspects of each technical skill (e.g., for programming: syntax, algorithms, debugging, etc.)
        
        Rules for Options:
        1. Each question MUST have exactly 4 options (a, b, c, d)
        2. Only ONE option should be correct
        3. The incorrect options should be plausible and related to the correct answer
        4. Make the incorrect options challenging by using common misconceptions or close-but-wrong answers
        5. Do NOT use placeholder options like "Option A" or "None of the above"
        6. All options should be of similar length and detail
        
        General Rules:
        1. Each question should be short, precise, and answerable in less than 20 seconds.
        2. Format strictly as:
        <question_number>. <question text>
        a) <option 1 - plausible but incorrect>
        b) <option 2 - plausible but incorrect>
        c) <option 3 - correct answer>
        d) <option 4 - plausible but incorrect>
        Answer: c) <correct option text>
        
        Job Description:
        {jd}
        
        Resume:
        {resume}
        **Note**: Below are just sample example. Genarete the questions on random topics.
        Example Mathematical Question:
        1. A boat travels 24 km upstream in 6 hours and the same distance downstream in 4 hours. What is the speed of the boat in still water?
        a) 3 km/h (incorrect but plausible - if you only divide total distance by total time)
        b) 4 km/h (incorrect but plausible - if you calculate using wrong formula)
        c) 6 km/h (correct answer)
        d) 8 km/h (incorrect but plausible - if you add instead of average)
        Answer: c) 6 km/h
        
        Example Technical Question:
        6. Which HTTP method is idempotent and used for updating existing resources in a REST API?
        a) POST (incorrect but plausible - commonly used but not idempotent)
        b) PUT (correct answer)
        c) PATCH (incorrect but plausible - used for partial updates but not always idempotent)
        d) GET (incorrect but plausible - idempotent but not for updates)
        Answer: b) PUT
        
        IMPORTANT: Do not include any explanations in parentheses in your actual output. The examples above include explanations only to show you how to create plausible incorrect options.
        """

        prompt = PromptTemplate(
            input_variables=["jd", "resume"],
            template=template
        )

        # Add timestamp to ensure different questions each time
        current_timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        formatted_prompt = prompt.format(jd=jd_text, resume=resume_text)
        formatted_prompt += f"\n\nGeneration timestamp: {current_timestamp}"
        
        # Add timeout protection
        try:
            # Use Gemini LLM
            llm = get_openai_llm()
            
            # Add timeout to prevent hanging requests
            response = await asyncio.wait_for(
                llm.ainvoke([HumanMessage(content=formatted_prompt)]),
                timeout=45.0  # 45 second timeout
            )
            
            # Return the result
            result = response.content
            if result:
                logger.info("MCQ generation successful.")
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
