from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
import os
from app.llm_models import openai_llm

def generate_jd(requirements: dict) -> str:

   
    prompt_template = """
    Create a concise, professional job description that fits within a single A4 PDF page.
    
    Company Description: {company_description}
    Job Role: {job_role}
    Location: {location}
    Required Experience: {experience}
    Required Qualifications: {qualifications}
    Required Skills: {skills}
    
    Keep the description clear, impactful, and short:
    - Job Summary should be 3-4 lines max.
    - List only 4-5 key responsibilities.
    - Keep qualifications, skills, and experience concise (bulleted where possible).
    - Avoid repetition and unnecessary fluff.
    - Use clean markdown formatting for readability.
    """

    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=[
            "company_description",
            "job_role",
            "location",
            "experience",
            "qualifications",
            "skills"
        ]
    )

    llm = openai_llm.get_openai_llm()
    
    chain = prompt | llm

    response = chain.invoke({
        "company_description": requirements.get("company_description", ""),
        "job_role": requirements.get("job_role", ""),
        "location": requirements.get("location", ""),
        "experience": requirements.get("experience", ""),
        "qualifications": requirements.get("qualifications", ""),
        "skills": requirements.get("skills", "")
    })

    return response.content
