from ..llm_models.openai_llm import get_openai_llm
from langchain.prompts import PromptTemplate
from langchain_core.messages import HumanMessage
import logging
from ..config import settings
import os

logger = logging.getLogger(__name__)

async def generate_mcqs(jd_text: str, resume_text: str) -> str:
    """
    Generate MCQs based on job description and resume using Gemini LLM.
    Returns: JSON string of MCQs
    """
    try:
        # Escape braces inside JSON example
        template = """
You are an expert technical interviewer.
Your task is to create exactly 5 medium-level, skill-based multiple-choice questions 
derived from the given job description and the candidate’s resume.

Rules:
1. Questions must be technical and based ONLY on:
   - Skills explicitly mentioned in the job description
   - Skills explicitly mentioned in the candidate's resume
2. Do NOT mention "resume", "job description", or the candidate's name in the question text.
3. Focus on practical, applied knowledge, not definitions.
4. Each question should be short, precise, and answerable in less than 20 seconds.
5. Difficulty: Medium (slightly challenging but not overly complex).
6. Format strictly as:
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

Example:
1. Which HTTP method is idempotent and used for updating existing resources in a REST API?
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

        # Get OpenAI API key from environment or settings
        api_key = os.getenv("OPENAI_API_KEY")
        
        # Use OpenAI LLM instead of Gemini
        llm = get_openai_llm(api_key=api_key)
        response = await llm.ainvoke([HumanMessage(content=formatted_prompt)])

        logger.info("MCQ generation successful with OpenAI.")
        return response.content

    except Exception as e:
        logger.error(f"Error generating MCQs: {e}")
        return None
