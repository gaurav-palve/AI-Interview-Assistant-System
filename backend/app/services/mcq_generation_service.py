from ..llm_models.gemini_llm import get_gemini_llm
from langchain.prompts import PromptTemplate
from langchain_core.messages import HumanMessage
import logging

logger = logging.getLogger(__name__)

async def generate_mcqs(jd_text: str, resume_text: str) -> str:
    """
    Generate MCQs based on job description and resume using Gemini LLM
    
    Args:
        jd_text: Job description text
        resume_text: Resume text
        
    Returns:
        String containing generated MCQs
    """
    logger.info("Starting MCQ generation process")
    
    # Log input text lengths for debugging
    jd_length = len(jd_text) if jd_text else 0
    resume_length = len(resume_text) if resume_text else 0
    logger.info(f"Input text lengths - JD: {jd_length} chars, Resume: {resume_length} chars")
    
    if jd_length == 0:
        logger.warning("Empty job description text provided for MCQ generation")
    if resume_length == 0:
        logger.warning("Empty resume text provided for MCQ generation")
    
    prompt = PromptTemplate(
        input_variables=["jd", "resume"],
        template = '''
You are an expert technical interviewer. 
Generate exactly 5 multiple-choice questions based on the following job description and resume. 
Output in **valid JSON format only**, without extra text.

Job Description:
{jd}

Resume:
{resume}

must return JSON format:
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "answer": "string"
  }
]
'''
)


    logger.info("Formatting prompt for MCQ generation")
    formatted_prompt = prompt.format(jd=jd_text, resume=resume_text)
    prompt_length = len(formatted_prompt)
    logger.info(f"Formatted prompt length: {prompt_length} chars")
    
    messages = [HumanMessage(content=formatted_prompt)]

    logger.info("Initializing Gemini LLM")
    llm = get_gemini_llm()
    
    logger.info("Sending request to Gemini LLM for MCQ generation")
    try:
        response = llm(messages)
        response_length = len(response.content)
        logger.info(f"Received response from Gemini LLM (length: {response_length} chars)")
        
        # Log a preview of the response for debugging
        preview = response.content[:200] + "..." if len(response.content) > 200 else response.content
        logger.info(f"Response preview: {preview}")
        
        return response.content
    except Exception as e:
        logger.error(f"Error generating MCQs with Gemini LLM: {str(e)}")
        raise