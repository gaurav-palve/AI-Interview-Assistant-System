import os
from typing import Optional
from langchain_openai import ChatOpenAI

def get_openai_llm(
    api_key: Optional[str] = None,
    model: str = "gpt-4o-mini",
    temperature: float = 0.0,
):
    
    if api_key:
        os.environ["OPENAI_API_KEY"] = api_key
    llm = ChatOpenAI(model=model, temperature=temperature)
    return llm
