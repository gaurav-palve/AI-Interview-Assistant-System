from app.llm_models import openai_llm
from langchain_core.messages import HumanMessage
import json
from ..utils.logger import get_logger

logger = get_logger(__name__)

def suggest_skills(job_role) -> list:
    """
    Uses the OpenAI LLM to generate a top 10 list of skills for a job role.

    Args:
        job_role: The title of the job (e.g., "Data Scientist").

    Returns:
        A list of 10 skill strings, or an empty list if an error occurs.
    """
    try:
        # 1. Format the full prompt
        prompt_template =""" You are an expert career analyst and HR domain specialist.

Your task is to suggest **only the technical skills** that are strongly related to a given job role.

### Instructions:
1. Analyze the provided job role carefully.
2. Suggest **10 to 15 technical skills** that are:
   - Highly relevant and frequently required in job descriptions.
   - Current and industry-standard (no outdated technologies).
   - Focused on tools, frameworks, programming languages, platforms, and domain-specific technologies.
3. Exclude all soft skills, communication skills, or personality traits.
4. If applicable, include popular libraries or frameworks used in that role.
5. Output the result in **clean JSON format**.
Here is the Job Role:
---
{job_role_title}
---

Provide the JSON output now.
"""


        full_prompt = prompt_template.format(job_role_title=job_role)
        llm = openai_llm.get_openai_llm()
        # 2. Make the API call
        response = llm.invoke([HumanMessage(content=full_prompt)])
        
        # 3. Clean and parse the JSON response
        json_text = response.content.strip().replace("```json", "").replace("```", "").strip()
        
        # 4. Load the string as a Python dictionary
        skill_data = json.loads(json_text)
        
        # 5. Return the list directly
        return skill_data

    except json.JSONDecodeError as e:
        logger.info(f"Error: Failed to decode JSON from LLM response. Response was: {response.text}")
        return []
    except Exception as e:
        logger.info(f"An unexpected error occurred: {e}")
        return []