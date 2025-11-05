from langchain_core.messages import HumanMessage
from .logger import get_logger
from app.llm_models.openai_llm import get_openai_llm

logger = get_logger(__name__)

async def get_llm_coding_score(question_title: str, candidate_code: str) -> int:
    if not candidate_code or candidate_code is None:
        return 0
    
    prompt = f"""
You are a strict technical evaluator.

Evaluate the following candidate's code for the question titled "{question_title}".

Code: {candidate_code}
Give a score from 0 to 10 based on:
1. Correctness of logic
2. Code efficiency
3. Readability

Return only the numeric score (0–10). No explanation."""
    try:
        llm = get_openai_llm()
        response = llm.invoke([HumanMessage(content=prompt)])
        score = int(response.content.strip())
        return max(0, min(score, 10))  # Ensure score is between
    
    except Exception as e:
        logger.error(f"Error evaluating code with LLM: {e}")
        return 0