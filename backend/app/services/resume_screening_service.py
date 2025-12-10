import zipfile
import os
import tempfile
import fitz  # PyMuPDF
import pandas as pd
import numpy as np
import json
import re
import asyncio
from app.config import settings
from concurrent.futures import ThreadPoolExecutor
from sklearn.metrics.pairwise import cosine_similarity
from openai import OpenAI
from dotenv import load_dotenv
from app.utils.logger import get_logger
from PIL import Image
import io
from app.utils import pdf_text_extraction_using_llm

logger = get_logger(__name__)

load_dotenv()
OPENAI_API_KEY = settings.OPENAI_API_KEY

CHEAP_LLM_MODEL = "gpt-3.5-turbo"
EMBEDDING_MODEL = "text-embedding-3-small"
LLM_MODEL = "gpt-4o-mini"
TOP_N = 5
CHUNK_SIZE = 1500

client = OpenAI(api_key=OPENAI_API_KEY)
executor = ThreadPoolExecutor(max_workers=10)

# ---------------------------------
# Utility Functions
# ---------------------------------
def extract_text_from_pdf(pdf_path):
    text = ""
    doc = fitz.open(pdf_path)
    for page in doc:
        text += page.get_text("text") + "\n"
    return text.strip()

def extract_resumes_from_zip(resume_input_path):
    extracted_files = []
    temp_dir = tempfile.mkdtemp()
    with zipfile.ZipFile(resume_input_path, "r") as zip_ref:
        zip_ref.extractall(temp_dir)
    for root, _, files in os.walk(temp_dir):
        for file in files:
            if file.lower().endswith(".pdf"):
                extracted_files.append(os.path.join(root, file))
    return extracted_files

def chunk_text(text, chunk_size=1500):
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

def get_embeddings_batch(texts):
    if not texts:
        return np.array([])
    response = client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return np.array([item.embedding for item in response.data])

def get_resume_chunk_embeddings(resume_files, resume_texts):
    all_chunks, chunk_to_resume = [], []
    for file, text in zip(resume_files, resume_texts):
        chunks = chunk_text(text)
        all_chunks.extend(chunks)
        chunk_to_resume.extend([file] * len(chunks))
    chunk_embeddings = get_embeddings_batch(all_chunks)
    return all_chunks, chunk_embeddings, chunk_to_resume

def semantic_search(jd_text, resume_files, resume_texts, top_k=5):
    jd_embedding = get_embeddings_batch([jd_text])[0]
    all_chunks, chunk_embeddings, chunk_to_resume = get_resume_chunk_embeddings(resume_files, resume_texts)
    similarities = cosine_similarity([jd_embedding], chunk_embeddings)[0]

    resume_scores = {}
    for file in resume_files:
        indices = [i for i, f in enumerate(chunk_to_resume) if f == file]
        top_chunks = sorted([similarities[i] for i in indices], reverse=True)[:top_k]
        resume_scores[file] = np.mean(top_chunks) if top_chunks else 0.0
    return resume_scores

def semantic_weight(text):
    word_count = len(text.split())
    if word_count < 50:
        return 0.1
    sections = ["experience", "project", "achievement", "education", "work"]
    section_score = sum([1 for s in sections if s in text.lower()]) / len(sections)
    chunks = chunk_text(text)
    if len(chunks) > 1:
        embeddings = get_embeddings_batch(chunks)
        var = np.mean(np.var(embeddings, axis=0))
    else:
        var = 0.1
    var_score = min(var * 10, 1.0)
    return 0.3 * section_score + 0.3 * var_score + 0.4 * min(word_count / 300, 1)

def openai_extract_experience_from_jd(jd_text):
    prompt = f"""
    Extract required experience from the job description.
    Respond ONLY JSON like:
    {{ "min": 3, "max": 5 }}
    If no experience is mentioned or freshers, use {{ "min": 0, "max": null }}.
    JD: {jd_text}
    """
    try:
        response = client.chat.completions.create(
            model=CHEAP_LLM_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert JD parser. Return only JSON with min and max experience."},
                {"role": "user", "content": prompt},
            ],
            temperature=0,
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.replace("```json", "").replace("```", "").strip()
        data = json.loads(content)
        min_exp = data.get("min", 0)
        max_exp = data.get("max", None)
        if min_exp == 0:
            max_exp = 1

        return min_exp, max_exp
    except:
        return 0, None

def openai_extract_experience_from_resume(resume_text):
    prompt = f"""
    You are an expert resume parser. Extract total years of full-time work experience.
    Return JSON strictly like: {{"total_years": 5.5}}
    If no experience found, return {{"total_years": 0}}.
    Resume: {resume_text[:6000]}
    """
    try:
        response = client.chat.completions.create(
            model=CHEAP_LLM_MODEL,
            messages=[
                {"role": "system", "content": "You are a resume parser. Return only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0,
        )
        raw_text = response.choices[0].message.content.strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.replace("```json", "").replace("```", "").strip()
        result = json.loads(raw_text)
        return float(result.get("total_years", 0))
    except:
        return 0.0

def passes_experience_filter(candidate_years, min_exp, max_exp):
    """Check if candidate experience passes the filter with ±0.5 year flexibility"""
    if candidate_years is None:
        return False
    
    min_allowed = (min_exp) if min_exp is not None else None
    max_allowed = (max_exp + 0.5) if max_exp is not None else None
    if min_allowed is not None and candidate_years < min_allowed:
        return False
    if max_allowed is not None and candidate_years > max_allowed:
        return False
    return True

def get_llm_score(jd_text, resume_text):
    prompt = f"""
    You are an ATS scoring engine.
    Compare the job description and resume and return a JSON like:
    {{
      "email": "candidate@example.com",
      "score": 0-100,
      "strengths": ["skill1", "skill2"],
      "weaknesses": ["gap1", "gap2"]
    }}
    JD: {jd_text}
    Resume: {resume_text[:4000]}
    """
    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": "You are ATS scoring assistant. Respond ONLY with valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0,
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = re.sub(r"^```[a-zA-Z]*\n?", "", content)
            content = re.sub(r"\n?```$", "", content)
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            content = match.group(0)
        return json.loads(content)
    except:
        return {"email": None, "score": None, "strengths": [], "weaknesses": []}

# ---------------------------------
# Main Service Function
# ---------------------------------
async def process_resume_screening(resume_input_path, jd_path):
    logger.info(f"Starting resume screening process with file: {resume_input_path}, jd: {jd_path}")

    # -----------------------------
    # 1. Detect file type
    # -----------------------------
    if resume_input_path.lower().endswith(".zip"):
        logger.info("Detected ZIP file, extracting resumes...")
        resume_files = extract_resumes_from_zip(resume_input_path)
    else:
        logger.info("Detected single resume PDF file")
        resume_files = [resume_input_path]
    logger.info(f"Total resumes to process: {len(resume_files)}")

    # -----------------------------
    # 2. Extract text
    # -----------------------------
    resume_texts = [extract_text_from_pdf(f) for f in resume_files]
    if len(resume_texts[0])==0:
        for f in resume_files:
            resume_texts = [await pdf_text_extraction_using_llm.extract_data(f)]
   
    logger.info("Extracted text from all resumes")

    jd_text = extract_text_from_pdf(jd_path)
    logger.info(f"Extracted text from JD file, length: {len(jd_text)} characters")

    loop = asyncio.get_running_loop()
    candidate_years = await asyncio.gather(*[
        loop.run_in_executor(executor, openai_extract_experience_from_resume, text)
        for text in resume_texts
    ])

    min_exp, max_exp = openai_extract_experience_from_jd(jd_text)
    logger.info(f"Extracted experience requirements from JD: min={min_exp}, max={max_exp}")

    filtered_resumes = [t for t, yrs in zip(resume_texts, candidate_years) if passes_experience_filter(yrs, min_exp, max_exp)]
    filtered_files = [f for f, yrs in zip(resume_files, candidate_years) if passes_experience_filter(yrs, min_exp, max_exp)]
    
    logger.info(f"Filtered resumes based on experience: {len(filtered_resumes)}/{len(resume_texts)} passed the filter")

    if not filtered_resumes:
        logger.info("No resumes passed the experience filter, returning empty results")
        return {"results": []}

    logger.info("Performing semantic search to match resumes with job description")
    resume_scores = semantic_search(jd_text, filtered_files, filtered_resumes, top_k=5)
    resume_scores = {f: s * semantic_weight(filtered_resumes[filtered_files.index(f)]) for f, s in resume_scores.items()}
    shortlisted_files = sorted(resume_scores.items(), key=lambda x: x[1], reverse=True)[:TOP_N]
    logger.info(f"Shortlisted {len(shortlisted_files)} resumes based on semantic search")

    logger.info("Getting detailed LLM scoring for shortlisted resumes")
    llm_results = await asyncio.gather(*[
        loop.run_in_executor(executor, get_llm_score, jd_text, filtered_resumes[filtered_files.index(file)])
        for file, _ in shortlisted_files
    ])

    results = []
    for (file, _), llm_result in zip(shortlisted_files, llm_results):
        results.append({
            "resume": os.path.basename(file),
            "candidate_email": llm_result.get("email"),
            "ATS_Score": llm_result.get("score"),
            "Strengths": llm_result.get("strengths", []),
            "Weaknesses": llm_result.get("weaknesses", []),
        })

    # Sort by ATS_Score descending
    results = sorted(results, key=lambda x: x["ATS_Score"] or 0, reverse=True)
    logger.info(f"Resume screening completed, returning {len(results)} ranked results")
    return {"results": results}
