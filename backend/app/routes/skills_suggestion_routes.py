from fastapi import APIRouter, Body, HTTPException
from fastapi.params import Depends
from pydantic import BaseModel, Field
import logging
from app.utils import skills_suggestions
from app.utils.auth_dependency import get_current_user
class SkillsSuggestionRequest(BaseModel):
    job_role: str = Field(..., description="The job role for which to suggest skills")
    
router = APIRouter()
logger = logging.getLogger(__name__)
@router.post("/skills-suggestion")
async def skills_suggestion(request: SkillsSuggestionRequest  = Body(...),
                            current_user: dict = Depends(get_current_user)):
    """
    Generate a list of technical skills strongly related to the given job role.
    
    Args:
        job_role: The name of the job role (e.g., Python Developer, Data Scientist)

    Returns:
        A list of suggested technical skills.
    """
    try:
        logger.info(f"Generating skill suggestions for job role: {request.job_role}")

        # Validate input
        if not request.job_role or request.job_role.strip() == "":
            logger.error("Invalid job_role: Empty value received")
            raise HTTPException(status_code=400, detail="Job role cannot be empty.")

        # suggest_skills is synchronous (calls LLM synchronously), call directly
        raw = skills_suggestions.suggest_skills(request.job_role)

        # Normalize the LLM output into a simple list of skill strings
        skills_list = []
        if isinstance(raw, list):
            skills_list = raw
        elif isinstance(raw, dict):
            # Common keys produced by the LLM util
            if 'skills' in raw and isinstance(raw['skills'], list):
                skills_list = raw['skills']
            elif 'technical_skills' in raw and isinstance(raw['technical_skills'], list):
                skills_list = raw['technical_skills']
            else:
                # Fallback: take the first list value found in the dict
                for v in raw.values():
                    if isinstance(v, list):
                        skills_list = v
                        break
        elif isinstance(raw, str):
            # Try to parse JSON string or comma-separated list
            try:
                import json as _json
                parsed = _json.loads(raw)
                if isinstance(parsed, list):
                    skills_list = parsed
                elif isinstance(parsed, dict):
                    # look for a list value
                    for v in parsed.values():
                        if isinstance(v, list):
                            skills_list = v
                            break
            except Exception:
                # fallback: split by commas
                skills_list = [s.strip() for s in raw.split(',') if s.strip()]

        # Final sanity check
        if not skills_list:
            logger.warning(f"No skills generated for job role: {request.job_role} (raw={type(raw)})")
            raise HTTPException(status_code=404, detail="No skills found for the specified job role.")

        logger.info(f"Successfully generated {len(skills_list)} skills for role: {request.job_role}")
        # Log raw for debugging as well
        logger.debug(f"Raw suggestion output: {raw}")
        return {"skills": skills_list}

    except HTTPException:
        # re-raise known HTTP exceptions to be handled by FastAPI
        raise
    except Exception as e:
        logger.exception(f"Error generating skills for job role '{getattr(request, 'job_role', None)}': {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error while generating skills.")