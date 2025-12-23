import zipfile
import os
import tempfile
import fitz  # PyMuPDF
import pandas as pd
import numpy as np
import json
import re
import asyncio
from datetime import datetime
from dateutil import parser as date_parser
from app.config import settings
from concurrent.futures import ThreadPoolExecutor
from sklearn.metrics.pairwise import cosine_similarity
from openai import OpenAI
from dotenv import load_dotenv
from app.utils.logger import get_logger

logger = get_logger(__name__)

load_dotenv()
OPENAI_API_KEY = settings.OPENAI_API_KEY

# Model Configuration
CHEAP_LLM_MODEL = "gpt-3.5-turbo"
EMBEDDING_MODEL = "text-embedding-3-small"
LLM_MODEL = "gpt-4o"  # Using most accurate model for scoring
EXPERIENCE_EXTRACTION_MODEL = "gpt-4o"  # Dedicated accurate model for experience extraction
TOP_N = 8
CHUNK_SIZE = 1500
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

client = OpenAI(api_key=OPENAI_API_KEY)
executor = ThreadPoolExecutor(max_workers=10)

# ---------------------------------
# Token Tracking Functions (Placeholders)
# ---------------------------------
def estimate_chat_tokens(messages, model):
    """Estimate token count for chat messages"""
    try:
        total_chars = sum(len(str(msg.get('content', ''))) for msg in messages)
        # Rough estimation: ~4 characters per token
        estimated_tokens = total_chars // 4
        return estimated_tokens, 0  # (prompt_tokens, completion_tokens estimate)
    except Exception as e:
        logger.warning(f"Error estimating tokens: {str(e)}")
        return 0, 0

def track_openai_chat_completion(response, messages, model, service):
    """Track OpenAI chat completion usage"""
    try:
        usage = response.usage
        logger.info(f"[{service}] Tokens used - Prompt: {usage.prompt_tokens}, Completion: {usage.completion_tokens}, Total: {usage.total_tokens}")
    except Exception as e:
        logger.warning(f"Error tracking chat completion: {str(e)}")

def track_openai_embeddings(response, input_texts, model, service):
    """Track OpenAI embeddings usage"""
    try:
        usage = response.usage
        logger.info(f"[{service}] Embedding tokens used: {usage.total_tokens} for {len(input_texts)} texts")
    except Exception as e:
        logger.warning(f"Error tracking embeddings: {str(e)}")

# ---------------------------------
# Utility Functions
# ---------------------------------
def extract_text_from_pdf(pdf_path):
    """Extract text from PDF with error handling and retries"""
    for attempt in range(MAX_RETRIES):
        try:
            text = ""
            doc = fitz.open(pdf_path)
            for page in doc:
                text += page.get_text("text") + "\n"
            doc.close()
            
            if text.strip():
                logger.info(f"Successfully extracted text from {os.path.basename(pdf_path)}: {len(text)} characters")
                return text.strip()
            else:
                logger.warning(f"PDF {os.path.basename(pdf_path)} appears to be empty or image-based")
                return ""
                
        except Exception as e:
            logger.error(f"Attempt {attempt + 1}/{MAX_RETRIES} - Error extracting text from {pdf_path}: {str(e)}")
            if attempt < MAX_RETRIES - 1:
                asyncio.sleep(RETRY_DELAY)
            else:
                return ""

def extract_resumes_from_zip(zip_path):
    """Extract all PDF files from zip archive"""
    extracted_files = []
    temp_dir = tempfile.mkdtemp()
    
    try:
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(temp_dir)
        
        for root, _, files in os.walk(temp_dir):
            for file in files:
                if file.lower().endswith(".pdf"):
                    full_path = os.path.join(root, file)
                    extracted_files.append(full_path)
        
        logger.info(f"Extracted {len(extracted_files)} PDF files from zip: {zip_path}")
        return extracted_files
    except Exception as e:
        logger.error(f"Error extracting zip file {zip_path}: {str(e)}")
        return []

def chunk_text(text, chunk_size=1500):
    """Split text into chunks with overlap for better context"""
    if not text:
        return []
    
    overlap = chunk_size // 4  # 25% overlap
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk)
        start = end - overlap if end < len(text) else end
        
    logger.debug(f"Chunking text of length {len(text)} into {len(chunks)} chunks")
    return chunks

def get_embeddings_batch(texts, retry_count=0):
    """Get embeddings for batch of texts with retry logic"""
    if not texts:
        logger.warning("No texts provided for embedding")
        return np.array([])
    
    # Filter out empty texts
    valid_texts = [t for t in texts if t and t.strip()]
    if not valid_texts:
        logger.warning("All texts are empty after filtering")
        return np.array([])
    
    try:
        logger.debug(f"Getting embeddings for {len(valid_texts)} text chunks")
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=valid_texts
        )
        
        # Track token usage for embeddings
        track_openai_embeddings(
            response=response,
            input_texts=valid_texts,
            model=EMBEDDING_MODEL,
            service="resume_screening_embeddings"
        )
        
        embeddings = np.array([item.embedding for item in response.data])
        logger.debug(f"Successfully generated {len(embeddings)} embeddings")
        return embeddings
        
    except Exception as e:
        logger.error(f"Error getting embeddings (attempt {retry_count + 1}/{MAX_RETRIES}): {str(e)}")
        
        if retry_count < MAX_RETRIES - 1:
            import time
            time.sleep(RETRY_DELAY * (retry_count + 1))
            return get_embeddings_batch(texts, retry_count + 1)
        
        logger.error("Max retries reached for embeddings, returning empty array")
        return np.array([])

def get_resume_chunk_embeddings(resume_files, resume_texts):
    """Generate embeddings for resume chunks with validation"""
    all_chunks, chunk_to_resume = [], []
    
    logger.info(f"Processing {len(resume_files)} resumes for chunk embeddings")
    
    for file, text in zip(resume_files, resume_texts):
        if not text or not text.strip():
            logger.warning(f"Skipping empty resume: {os.path.basename(file)}")
            continue
            
        chunks = chunk_text(text)
        if chunks:
            all_chunks.extend(chunks)
            chunk_to_resume.extend([file] * len(chunks))
            logger.debug(f"Resume {os.path.basename(file)}: {len(chunks)} chunks created")
    
    if not all_chunks:
        logger.error("No valid chunks created from any resume")
        return [], np.array([]), []
    
    logger.info(f"Total chunks across all resumes: {len(all_chunks)}")
    chunk_embeddings = get_embeddings_batch(all_chunks)
    
    if chunk_embeddings.size == 0:
        logger.error("Failed to generate embeddings for resume chunks")
        return all_chunks, np.array([]), chunk_to_resume
    
    logger.info(f"Generated embeddings for all chunks")
    return all_chunks, chunk_embeddings, chunk_to_resume

def semantic_search(jd_text, resume_files, resume_texts, top_k=10):
    """Perform semantic similarity search with robust error handling"""
    logger.info(f"Starting semantic search with {len(resume_files)} resumes")
    
    if not jd_text or not jd_text.strip():
        logger.error("Job description text is empty")
        return {file: 0.0 for file in resume_files}
    
    # Get JD embedding with validation
    jd_embedding_array = get_embeddings_batch([jd_text])
    
    if jd_embedding_array.size == 0:
        logger.error("Failed to generate JD embedding, returning zero scores")
        return {file: 0.0 for file in resume_files}
    
    jd_embedding = jd_embedding_array[0]
    logger.debug("Generated JD embedding successfully")
    
    all_chunks, chunk_embeddings, chunk_to_resume = get_resume_chunk_embeddings(resume_files, resume_texts)
    
    if chunk_embeddings.size == 0 or len(all_chunks) == 0:
        logger.error("No valid embeddings for resume chunks, returning zero scores")
        return {file: 0.0 for file in resume_files}
    
    logger.info("Calculating cosine similarities between JD and resume chunks")
    try:
        similarities = cosine_similarity([jd_embedding], chunk_embeddings)[0]
    except Exception as e:
        logger.error(f"Error calculating cosine similarity: {str(e)}")
        return {file: 0.0 for file in resume_files}

    resume_scores = {}
    for file in resume_files:
        indices = [i for i, f in enumerate(chunk_to_resume) if f == file]
        if not indices:
            resume_scores[file] = 0.0
            logger.warning(f"No chunks found for resume: {os.path.basename(file)}")
            continue
            
        top_chunks = sorted([similarities[i] for i in indices], reverse=True)[:top_k]
        score = np.mean(top_chunks) if top_chunks else 0.0
        resume_scores[file] = score
        logger.debug(f"Resume {os.path.basename(file)}: semantic score = {score:.4f}")
    
    logger.info("Semantic search completed")
    return resume_scores

def semantic_weight(text):
    """Calculate semantic weight for resume text with improved scoring"""
    if not text or not text.strip():
        return 0.0
    
    word_count = len(text.split())
    if word_count < 50:
        logger.debug(f"Text too short ({word_count} words), returning low weight")
        return 0.2
    
    # Check for key resume sections
    sections = ["experience", "project", "achievement", "education", "work", "skills", "responsibilities"]
    section_score = sum([1 for s in sections if s in text.lower()]) / len(sections)
    
    # Calculate diversity score from chunks
    chunks = chunk_text(text, chunk_size=1000)
    if len(chunks) > 1:
        embeddings = get_embeddings_batch(chunks[:5])  # Limit to first 5 chunks for efficiency
        if embeddings.size > 0:
            var = np.mean(np.var(embeddings, axis=0))
        else:
            var = 0.1
    else:
        var = 0.1
    
    var_score = min(var * 10, 1.0)
    
    # Word count score with better scaling
    word_score = min(word_count / 500, 1.0)
    
    # Weighted combination
    weight = 0.35 * section_score + 0.25 * var_score + 0.40 * word_score
    
    logger.debug(f"Semantic weight calculated: {weight:.4f} (words: {word_count}, sections: {section_score:.2f}, diversity: {var_score:.2f})")
    return weight

def openai_extract_experience_from_jd(jd_text):
    """Extract experience requirements from JD using GPT-4o"""
    prompt = f"""
You are an expert job description parser. Extract the required years of work experience from this job description.

CRITICAL RULES:
1. Look for experience requirements in phrases like:
   - "X years of experience"
   - "X+ years" or "minimum X years" or "at least X years"
   - "X-Y years" or "X to Y years of experience"
   - "Fresh graduates" or "Freshers" or "Entry level"
2. Common locations: Requirements section, Qualifications, Must-haves, Experience section
3. Distinguish between:
   - Total work experience
   - Experience in specific technology/domain
   - Choose the TOTAL work experience requirement

CURRENT DATE: December 2025

JOB DESCRIPTION:
{jd_text[:6000]}

Return ONLY valid JSON in this exact format:
{{
    "min": <number>,
    "max": <number or null>,
    "experience_type": "<TOTAL|DOMAIN_SPECIFIC|TECHNOLOGY_SPECIFIC>",
    "original_text": "<exact text from JD mentioning experience>",
    "explanation": "<how you determined min and max>"
}}

RULES FOR MIN AND MAX:
- "5+ years" → {{"min": 5, "max": null}}
- "3-5 years" → {{"min": 3, "max": 5}}
- "minimum 2 years" → {{"min": 2, "max": null}}
- "freshers" or "entry level" or no experience mentioned → {{"min": 0, "max": 1}}
- "2 to 4 years" → {{"min": 2, "max": 4}}

EXAMPLES:
JD: "We are looking for candidates with 3-5 years of experience in software development"
Return: {{"min": 3, "max": 5, "experience_type": "TOTAL", "original_text": "3-5 years of experience", "explanation": "Range specified as 3-5 years"}}

JD: "Minimum 7 years of professional experience required"
Return: {{"min": 7, "max": null, "experience_type": "TOTAL", "original_text": "Minimum 7 years of professional experience", "explanation": "Minimum specified, no maximum"}}

JD: "Fresh graduates or candidates with up to 1 year of experience"
Return: {{"min": 0, "max": 1, "experience_type": "TOTAL", "original_text": "Fresh graduates or candidates with up to 1 year", "explanation": "Entry level position"}}
"""
    
    try:
        logger.info("Extracting experience requirements from JD using GPT-4o")
        
        messages = [
            {"role": "system", "content": "You are an expert JD parser with deep understanding of HR requirements. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ]
        
        estimated_tokens, _ = estimate_chat_tokens(messages, "gpt-4o")
        logger.debug(f"Estimated prompt tokens for JD experience extraction: {estimated_tokens}")
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0,
            response_format={"type": "json_object"}
        )
        
        track_openai_chat_completion(
            response=response,
            messages=messages,
            model="gpt-4o",
            service="extract_experience_from_jd"
        )
        
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.replace("```json", "").replace("```", "").strip()
        
        data = json.loads(content)
        min_exp = data.get("min", 0)
        max_exp = data.get("max", None)
        
        if min_exp == 0 and max_exp is None:
            max_exp = 1
        
        logger.info(f"✓ JD Experience Requirements: min={min_exp}, max={max_exp}")
        logger.info(f"✓ Experience Type: {data.get('experience_type', 'UNKNOWN')}")
        logger.info(f"✓ Original Text: {data.get('original_text', 'Not found')}")
        logger.info(f"✓ Explanation: {data.get('explanation', 'N/A')}")
        
        return min_exp, max_exp
    
    except Exception as e:
        logger.error(f"Error extracting experience from JD: {str(e)}")
        return 0, None

def openai_extract_experience_from_resume(resume_text):
    """Extract total years of experience from resume using GPT-4o"""
    prompt = f"""
You are an expert resume parser with 20 years of HR experience. Your task is to calculate the EXACT total years of professional work experience.

CRITICAL INSTRUCTIONS:
1. Search the ENTIRE resume for work experience sections (may be labeled as: "Experience", "Work History", "Employment", "Professional Experience", "Career History", etc.)
2. For EACH job position found, extract:
   - Company name
   - Job title/role
   - Start date (look for formats like: Jan 2020, 01/2020, January 2020, 2020, 14/07/2014 – 09/01/2015 etc.)
   - End date (could be: Present, Current, Till Date, ongoing, or a specific date)
3. Calculate duration for each position:
   - If end date is "Present", "Current", "Till Date", use December 2025 as end date
   - Calculate in months first, then convert to years with decimal precision
   - Example: March 2020 to December 2025 = 69 months = 5.8 years
4. Handle overlapping positions (if someone worked 2 jobs simultaneously, DON'T double count)
5. Ignore: internships (unless specifically mentioned as full-time), academic projects, volunteer work, freelance (unless significant)
6. Be precise with decimal values (e.g., 3.5 years, not 3 or 4)
7. DO NOT stop after reading the first few pages. You must scan the ENTIRE resume including older job entries to ensure all experience is counted.

CURRENT DATE: December 2025

RESUME TEXT:
{resume_text[:25000]}

You MUST return ONLY valid JSON in this exact format:
{{
    "total_years": <precise decimal number>,
    "positions": [
        {{
            "company": "<company name>",
            "title": "<job title>",
            "start_date": "<extracted start date>",
            "end_date": "<extracted end date>",
            "duration_months": <number of months>,
            "duration_years": <decimal years>
        }}
    ],
    "overlapping_periods": [
        "<description of any overlapping periods found>"
    ],
    "calculation_method": "<detailed step-by-step calculation explanation>",
    "confidence": "<HIGH|MEDIUM|LOW>"
}}

EXAMPLE:
If resume shows:
- Software Engineer at Google: Jan 2020 - Present
- Senior Developer at Microsoft: Mar 2018 - Dec 2019

Calculation:
- Google: Jan 2020 to Dec 2025 = 72 months = 6.0 years
- Microsoft: Mar 2018 to Dec 2019 = 22 months = 1.8 years
- Total: 6.0 + 1.8 = 7.8 years

Return: {{"total_years": 7.8, ...}}

If NO work experience found, return: {{"total_years": 0, "positions": [], "calculation_method": "No work experience found in resume", "confidence": "HIGH"}}
"""
    
    try:
        logger.info("Extracting experience from resume using GPT-4o")
        
        messages = [
            {
                "role": "system",
                "content": "You are a world-class resume parser and HR expert. You calculate work experience with mathematical precision. Always return valid JSON."
            },
            {"role": "user", "content": prompt}
        ]
        
        estimated_tokens, _ = estimate_chat_tokens(messages, "gpt-4o")
        logger.debug(f"Estimated prompt tokens for resume experience extraction: {estimated_tokens}")
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0,
            response_format={"type": "json_object"}
        )
        
        track_openai_chat_completion(
            response=response,
            messages=messages,
            model="gpt-4o",
            service="extract_experience_from_resume"
        )
        
        raw_text = response.choices[0].message.content.strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.replace("```json", "").replace("```", "").strip()
        
        result = json.loads(raw_text)
        total_years = float(result.get("total_years", 0))
        positions = result.get("positions", [])
        
        logger.info(f"✓ Extracted experience: {total_years} years")
        logger.info(f"✓ Positions found: {len(positions)}")
        logger.info(f"✓ Confidence: {result.get('confidence', 'UNKNOWN')}")
        
        if positions:
            logger.info("Position breakdown:")
            for i, pos in enumerate(positions, 1):
                logger.info(f"  {i}. {pos.get('title', 'Unknown')} at {pos.get('company', 'Unknown')}")
                logger.info(f"     {pos.get('start_date', 'N/A')} to {pos.get('end_date', 'N/A')} = {pos.get('duration_years', 0)} years")
        
        logger.info(f"Calculation method: {result.get('calculation_method', 'N/A')[:200]}")
        
        if result.get('overlapping_periods'):
            logger.warning(f"Overlapping periods detected: {result.get('overlapping_periods')}")
        
        return total_years
    
    except Exception as e:
        logger.error(f"Error extracting experience from resume: {str(e)}")
        return 0.0

def passes_experience_filter(candidate_years, min_exp, max_exp):
    """Check if candidate passes experience filter with flexible matching"""
    if candidate_years is None:
        logger.debug("Candidate years is None, filtering out")
        return False
    
    min_allowed = min_exp if min_exp is not None else 0
    # Add 0.5 year buffer to max to account for rounding
    max_allowed = (max_exp + 0.5) if max_exp is not None else None
    
    if min_allowed > 0 and candidate_years < (min_allowed - 0.3):  # Allow 0.3 year flexibility below minimum
        logger.debug(f"Candidate {candidate_years} years < minimum {min_allowed}, filtered out")
        return False
    
    if max_allowed is not None and candidate_years > max_allowed:
        logger.debug(f"Candidate {candidate_years} years > maximum {max_allowed}, filtered out")
        return False
    
    logger.debug(f"Candidate {candidate_years} years passed filter (min: {min_allowed}, max: {max_allowed})")
    return True

def get_llm_score(jd_text, resume_text):
    """Get ATS score from LLM with improved prompting"""
    prompt = f"""
You are an advanced ATS (Applicant Tracking System) scoring engine with expertise in technical and professional recruitment.

Compare the job description and resume, then provide a detailed evaluation based on:
1. Skills match (technical and soft skills)
2. Experience relevance
3. Educational qualifications
4. Domain expertise
5. Cultural and role fit indicators

JOB DESCRIPTION:
{jd_text[:4000]}

RESUME:
{resume_text[:4000]}

Return ONLY valid JSON:
{{
    "email": "<candidate email or null>",
    "score": <0-100 integer>,
    "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
    "weaknesses": ["specific gap 1", "specific gap 2", "specific gap 3"]
}}

Scoring guidelines:
- score: Overall match percentage (0-100)
  - 90-100: Exceptional match, exceeds requirements
  - 70-89: Strong match, meets most requirements
  - 50-69: Moderate match, meets some requirements
  - 30-49: Weak match, significant gaps
  - 0-29: Poor match, not suitable
- strengths: List 3-5 specific skills/experiences that match well
- weaknesses: List 3-5 specific gaps or missing requirements
- Be specific, quantitative when possible, and actionable
"""
    
    try:
        logger.debug("Getting detailed LLM score for candidate")
        
        messages = [
            {"role": "system", "content": "You are an expert ATS scoring assistant with deep knowledge of recruitment standards. Respond ONLY with valid JSON."},
            {"role": "user", "content": prompt},
        ]
        
        estimated_tokens, _ = estimate_chat_tokens(messages, LLM_MODEL)
        logger.debug(f"Estimated prompt tokens for LLM scoring: {estimated_tokens}")
        
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            temperature=0.3,  # Slightly higher for more nuanced scoring
        )
        
        track_openai_chat_completion(
            response=response,
            messages=messages,
            model=LLM_MODEL,
            service="get_llm_score"
        )
        
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = re.sub(r"^```[a-zA-Z]*\n?", "", content)
            content = re.sub(r"\n?```$", "", content)
        
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            content = match.group(0)
        
        result = json.loads(content)
        
        # Validate score
        score = result.get('score', 0)
        if not isinstance(score, (int, float)) or score < 0 or score > 100:
            logger.warning(f"Invalid score {score}, defaulting to 0")
            result['score'] = 0
        
        logger.info(f"LLM Score: {result.get('score', 0)}, Email: {result.get('email', 'Not found')}")
        logger.debug(f"Strengths: {len(result.get('strengths', []))}, Weaknesses: {len(result.get('weaknesses', []))}")
        
        return result
    
    except Exception as e:
        logger.error(f"Error getting LLM score: {str(e)}")
        return {"email": None, "score": 0, "strengths": [], "weaknesses": ["Error in scoring process"]}

# ---------------------------------
# Main Service Function
# ---------------------------------
async def process_resume_screening(zip_path, jd_path):
    """
    Main function to process resume screening with improved error handling
    
    Args:
        zip_path: Path to zip file containing resumes
        jd_path: Path to job description PDF
    
    Returns:
        Dictionary with results matching original format
    """
    logger.info("=" * 80)
    logger.info("STARTING RESUME SCREENING PROCESS")
    logger.info(f"ZIP Path: {zip_path}")
    logger.info(f"JD Path: {jd_path}")
    logger.info("=" * 80)
    
    try:
        # Extract resumes from zip
        resume_files = extract_resumes_from_zip(zip_path)
        if not resume_files:
            logger.error("No PDF files found in the zip archive")
            return {"results": [], "error": "No PDF files found in zip"}
        
        logger.info(f"Total resume files extracted: {len(resume_files)}")
        
        # Extract text from resumes
        logger.info("Extracting text from all resume PDFs...")
        resume_texts = []
        valid_files = []
        
        for file in resume_files:
            text = extract_text_from_pdf(file)
            if text and len(text.strip()) > 100:  # Minimum 100 chars for valid resume
                resume_texts.append(text)
                valid_files.append(file)
            else:
                logger.warning(f"Skipping resume with insufficient text: {os.path.basename(file)}")
        
        resume_files = valid_files
        
        if not resume_texts:
            logger.error("No valid resume text extracted")
            return {"results": [], "error": "No valid text extracted from resumes"}
        
        logger.info(f"Successfully extracted text from {len(resume_texts)} resumes")
        
        # Extract JD text
        logger.info("Extracting text from JD PDF...")
        jd_text = extract_text_from_pdf(jd_path)
        if not jd_text or len(jd_text.strip()) < 100:
            logger.error("Failed to extract sufficient text from JD file")
            return {"results": [], "error": "Invalid job description"}
        
        logger.info(f"JD text extracted: {len(jd_text)} characters")
        
        # Extract experience from all resumes in parallel
        logger.info("=" * 80)
        logger.info("PHASE 1: EXTRACTING EXPERIENCE FROM ALL RESUMES")
        logger.info("=" * 80)
        
        loop = asyncio.get_running_loop()
        candidate_years = await asyncio.gather(*[
            loop.run_in_executor(executor, openai_extract_experience_from_resume, text)
            for text in resume_texts
        ])
        
        logger.info("Experience extraction completed for all resumes")
        for file, years in zip(resume_files, candidate_years):
            logger.info(f"  - {os.path.basename(file)}: {years} years")
        
        # Extract experience requirements from JD
        logger.info("=" * 80)
        logger.info("PHASE 2: ANALYZING JOB DESCRIPTION")
        logger.info("=" * 80)
        
        min_exp, max_exp = openai_extract_experience_from_jd(jd_text)
        logger.info(f"JD Experience Requirements: {min_exp} - {max_exp if max_exp else 'No Max'} years")
        
        # Filter resumes by experience
        logger.info("=" * 80)
        logger.info("PHASE 3: FILTERING RESUMES BY EXPERIENCE")
        logger.info("=" * 80)
        
        filtered_resumes = []
        filtered_files = []
        filtered_years = []
        
        for file, text, years in zip(resume_files, resume_texts, candidate_years):
            passes = passes_experience_filter(years, min_exp, max_exp)
            status = "✓ PASS" if passes else "✗ FAIL"
            logger.info(f"{status} - {os.path.basename(file)}: {years} years")
            
            if passes:
                filtered_resumes.append(text)
                filtered_files.append(file)
                filtered_years.append(years)
        
        logger.info(f"Experience Filter Results: {len(filtered_resumes)}/{len(resume_texts)} candidates passed")
        
        if not filtered_resumes:
            logger.warning("No resumes passed the experience filter")
            return {"results": [], "message": "No candidates matched experience requirements"}
        
        # Semantic search on filtered resumes
        logger.info("=" * 80)
        logger.info("PHASE 4: SEMANTIC SEARCH AND RANKING")
        logger.info("=" * 80)
        
        resume_scores = semantic_search(jd_text, filtered_files, filtered_resumes, top_k=5)
        
        # Validate scores
        if not resume_scores or all(score == 0.0 for score in resume_scores.values()):
            logger.warning("All semantic scores are zero, using equal weighting")
            resume_scores = {file: 0.5 for file in filtered_files}
        
        # Apply semantic weights
        logger.info("Applying semantic weights to scores...")
        weighted_scores = {}
        for file, score in resume_scores.items():
            text = filtered_resumes[filtered_files.index(file)]
            weight = semantic_weight(text)
            weighted_score = score * weight
            weighted_scores[file] = weighted_score
            logger.debug(f"{os.path.basename(file)}: score={score:.4f}, weight={weight:.4f}, final={weighted_score:.4f}")
        
        # Shortlist top N
        shortlisted_files = sorted(weighted_scores.items(), key=lambda x: x[1], reverse=True)[:TOP_N]
        logger.info(f"Shortlisted top {len(shortlisted_files)} candidates for detailed scoring")
        
        for rank, (file, score) in enumerate(shortlisted_files, 1):
            logger.info(f"  {rank}. {os.path.basename(file)}: score={score:.4f}")
        
        # Get detailed LLM scores
        logger.info("=" * 80)
        logger.info("PHASE 5: DETAILED LLM SCORING")
        logger.info("=" * 80)
        
        llm_results = await asyncio.gather(*[
            loop.run_in_executor(executor, get_llm_score, jd_text, filtered_resumes[filtered_files.index(file)])
            for file, _ in shortlisted_files
        ])
        
        # Compile results
        logger.info("=" * 80)
        logger.info("PHASE 6: COMPILING FINAL RESULTS")
        logger.info("=" * 80)
        
        results = []
        for (file, _), llm_result in zip(shortlisted_files, llm_results):
            file_index = filtered_files.index(file)
            experience_years = filtered_years[file_index]
            
            result = {
                "resume": os.path.basename(file),
                "candidate_email": llm_result.get("email"),
                "experience_years": experience_years,
                "ATS_Score": llm_result.get("score", 0),
                "Strengths": llm_result.get("strengths", []),
                "Weaknesses": llm_result.get("weaknesses", []),
            }
            results.append(result)
            
            logger.info(f"Candidate: {result['resume']}")
            logger.info(f"  Email: {result['candidate_email']}")
            logger.info(f"  Experience: {experience_years} years")
            logger.info(f"  ATS Score: {result['ATS_Score']}")
        
        # Sort by ATS score
        results = sorted(results, key=lambda x: x["ATS_Score"] or 0, reverse=True)
        
        logger.info("=" * 80)
        logger.info("RESUME SCREENING COMPLETED SUCCESSFULLY")
        logger.info(f"Total Processed: {len(resume_files)}")
        logger.info(f"Passed Filter: {len(filtered_resumes)}")
        logger.info(f"Final Results: {len(results)}")
        logger.info("=" * 80)
        
        return {"results": results}
    
    except Exception as e:
        logger.error(f"Critical error in resume screening process: {str(e)}")
        logger.exception("Full traceback:")
        return {"results": [], "error": str(e)}