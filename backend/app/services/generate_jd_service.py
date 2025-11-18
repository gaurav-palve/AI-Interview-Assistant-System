from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
import os
from app.llm_models import openai_llm

def generate_jd(requirements: dict) -> str:

   
    prompt_template = """
    Create a concise, professional job description that fits within a single A4 PDF page.
    
    Company Description: {company_description}
    Company Name : {company}
    Job Role: {job_title}
    Job Type: {job_type}
    Location: {work_location}
    Required Experience: {experience_level}
    Required Qualifications: {qualifications}
    Required Skills: {required_skills}
    Responsibilities: {responsibilities}

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
            "company",
            "job_title",
            "job_type",
            "work_location",
            "required_skills",
            "responsibilities"
        ]
    )

    llm = openai_llm.get_openai_llm()
    
    chain = prompt | llm

    response = chain.invoke({
        "company_description": requirements.get("company_description", ""),
        "company": requirements.get("company", ""),
        "job_title": requirements.get("job_title", ""),
        "job_type": requirements.get("job_type", ""),
        "work_location": requirements.get("work_location", ""),
        "experience_level": requirements.get("experience_level", ""),
        "qualifications": requirements.get("qualifications", ""),
        "required_skills": requirements.get("required_skills", ""),
        "responsibilities": requirements.get("responsibilities", "")
    })

    return response.content
