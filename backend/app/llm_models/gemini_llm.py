import os
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI

def get_gemini_llm(
    api_key: Optional[str] = None,
    model: str = "gemini-2.0-flash",
    temperature: float = 0.3,
):
    
    if api_key:
        os.environ["GOOGLE_API_KEY"] = api_key
    llm = ChatGoogleGenerativeAI(model=model, temperature=temperature)
    return llm
