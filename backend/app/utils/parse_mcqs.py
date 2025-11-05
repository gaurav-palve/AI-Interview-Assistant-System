import re

def parse_mcqs(response: str):
    mcq_list = []
    # Split on numbers like 1. , 2. , 3.
    mcqs = re.split(r'\n?\d+\.\s+', response.strip())
    
    for mcq in mcqs:
        if not mcq.strip():
            continue

        # Separate question+options from answer
        parts = mcq.strip().split("Answer:")
        q_and_options = parts[0].strip()
        answer_part = parts[1].strip() if len(parts) > 1 else ""

        # Extract question (before first option like "a)")
        q_split = re.split(r'\n?[a-d]\)', q_and_options, maxsplit=1)
        question_text = q_split[0].strip()

        # Extract options (all lines starting with a), b), c), d) …)
        options = re.findall(r'([a-d]\)\s.*)', q_and_options)

        mcq_list.append({
            "question": question_text,   # only the main question
            "options": options,          # clean options list
            "answer": answer_part
        })
    return mcq_list
