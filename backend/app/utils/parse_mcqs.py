import re

def parse_mcqs(response: str):
    mcq_list = []
    # Split on numbers (1. 2. 3.)
    mcqs = re.split(r'\n\d+\.\s+', response.strip())
    for mcq in mcqs:
        if not mcq.strip():
            continue
        # Separate question+options from answer
        parts = mcq.strip().split("Answer:")
        question_part = parts[0].strip()
        answer_part = parts[1].strip() if len(parts) > 1 else ""

        mcq_list.append({
            "question": question_part,
            "answer": answer_part
        })
    return mcq_list
