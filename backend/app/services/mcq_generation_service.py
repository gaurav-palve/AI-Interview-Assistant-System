from ..llm_models.gemini_llm import get_gemini_llm
from langchain.prompts import PromptTemplate
from langchain_core.messages import HumanMessage

async def generate_mcqs(jd_text: str, resume_text: str) -> str:
    
    prompt = PromptTemplate(
        input_variables=["jd", "resume"],
        template='''
Based on the following job description and resume, generate 5 multiple-choice technical questions relevant to the job role.

Job Description:
{jd}

Resume:
{resume}

List the MCQs in the following format:
1. Question
   a) Option1
   b) Option2
   c) Option3
   d) Option4
Answer: b) Option2
'''
    )


    formatted_prompt = prompt.format(jd=jd_text, resume=resume_text)
    messages = [HumanMessage(content=formatted_prompt)]

    llm=get_gemini_llm()
    response = llm(messages)
    

    return response.content