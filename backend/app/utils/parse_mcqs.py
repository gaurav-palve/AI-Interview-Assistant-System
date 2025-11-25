import re
import logging

logger = logging.getLogger(__name__)

def parse_mcqs(response: str):
    """
    Parse MCQs from the LLM response text.
    
    This function handles various formats of MCQs, including those with introductions,
    section headers, and different answer formats.
    """
    mcq_list = []
    
    # Log the raw response for debugging
    logger.debug(f"Raw MCQ response (first 200 chars): {response[:200]}...")
    
    # Split on numbers like 1. , 2. , 3.
    mcqs = re.split(r'\n?\d+\.\s+', response.strip())
    
    # Skip the first element if it's an introduction
    if mcqs and not re.search(r'[a-d]\)', mcqs[0]) and not re.search(r'Answer:', mcqs[0]):
        logger.info("Skipping introduction text in MCQs")
        mcqs = mcqs[1:]
    
    for mcq in mcqs:
        if not mcq.strip():
            continue

        # Separate question+options from answer
        parts = mcq.strip().split("Answer:")
        q_and_options = parts[0].strip()
        
        # Handle answer part, removing any ** prefix and section headers
        answer_part = ""
        if len(parts) > 1:
            answer_part = parts[1].strip()
            # Remove ** prefix if present
            answer_part = re.sub(r'^\*\*\s*', '', answer_part)
            # Remove any section headers that might be in the answer
            answer_part = re.sub(r'\n\n###.*$', '', answer_part)
        
        # Extract question (before first option like "a)")
        q_split = re.split(r'\n?[a-d]\)', q_and_options, maxsplit=1)
        question_text = q_split[0].strip()
        
        # Skip if this looks like a section header rather than a question
        if question_text.startswith("###") or len(question_text) < 10:
            logger.info(f"Skipping section header or short text: {question_text[:30]}...")
            continue

        # Extract options (all lines starting with a), b), c), d) …)
        options = re.findall(r'([a-d]\)\s.*)', q_and_options)
        
        # Only add if we have a question and options
        if question_text and options:
            mcq_list.append({
                "question": question_text,   # only the main question
                "options": options,          # clean options list
                "answer": answer_part
            })
    
    # Log the parsed MCQs for debugging
    logger.info(f"Parsed {len(mcq_list)} MCQs from response")
    
    return mcq_list
