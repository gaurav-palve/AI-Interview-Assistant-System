import json
import random
import time
from datetime import datetime
from typing import List
from app.models.question import Question, TestCase
from app.database import save_coding_questions
from langchain_core.messages import HumanMessage
from app.llm_models.openai_llm import get_openai_llm

import logging

logger = logging.getLogger(__name__)

QUESTION_TOPICS = [
    "string manipulation", "array operations", "mathematical algorithms",
    "sorting algorithms", "searching algorithms", "dynamic programming",
    "recursion", "stacks", "queues", "bit manipulation","list","dictionary","set","DSA"
]
DIFFICULTY_LEVELS = ["easy", "medium", "hard"]

class CodingQuestionsGenerationService:
    def __init__(self):
        self.llm = get_openai_llm()

    def generate_coding_questions(self, count: int = 3, difficulty: str = "medium") -> List[Question]:
        """Generate multiple coding questions synchronously."""
        valid_difficulty = difficulty.lower() if difficulty.lower() in DIFFICULTY_LEVELS else "easy"
        topics = random.sample(QUESTION_TOPICS, k=min(count, len(QUESTION_TOPICS)))

        questions = []
        for topic in topics:
            try:
                question = self._generate_single_question(valid_difficulty, topic)
                questions.append(question)
                print(questions)
            except Exception as e:
                logger.warning(f"Failed to generate question for topic '{topic}': {e}")
        return questions

    def _generate_single_question(self, difficulty: str, topic: str) -> Question:
        timestamp = int(time.time())
        random_seed = random.randint(0, 9999)

        prompt = f"""
Generate a {difficulty} programming question about {topic}.
Respond ONLY with a valid JSON object, STRICTLY following this format:

{{
  "title": "string",
  "difficulty": "easy|medium|hard",
  "description": "string",
  "testCases": [
    {{
      "input": "string",
      "expectedOutput": "string",
      "explanation": "string"
    }},
    ...
  ],
  "functionSignature": "string",
  "solutionTemplate": "string",
  "solutionTemplates": {{
    "javascript": "string",
    "python": "string",
    "java": "string"
  }}
}}

Rules:
1. Do NOT include extra text, markdown, or explanations.
2. Ensure all keys are exactly as above, with correct colons and quotes.
3. Include exactly 5 test cases.
4. Keep all strings properly quoted and escape special characters if needed.
5. Use random seed: {random_seed}, timestamp: {timestamp}.
6. IMPORTANT: For solutionTemplate and solutionTemplates, provide ONLY empty function skeletons WITHOUT any implementation.
7. DO NOT include the actual solution in any template.
8. CRITICAL: Ensure all code templates include proper line breaks using \\n to format code on multiple lines.
"""

# Examples of proper templates (not included in the prompt to avoid Pylance errors)
# JavaScript: "function addNumbers(a, b) {\n  // Your code here\n  return null;\n}"
# Python: "def add_numbers(a, b):\n    # Your code here\n    return None"
# Java: "public int addNumbers(int a, int b) {\n    // Your code here\n    return 0;\n}"
        # Python: "def add_numbers(a, b):\n    # Your code here\n    return None"
        # Java: "public int addNumbers(int a, int b) {\n    // Your code here\n    return 0;\n}"

        response = self.llm.invoke([HumanMessage(content=prompt)])
        content = response.content 

        try:
            question_data = json.loads(content)

        except json.JSONDecodeError:
            logger.error(f"Failed to parse LLM output as JSON:\n{content}")
            raise ValueError("Invalid JSON returned by LLM")

        return self._build_question_object(question_data, topic)

    def _build_question_object(self, question_data: dict, topic: str) -> Question:
        test_cases = [
            TestCase(
                input=tc["input"],
                expectedOutput=tc["expectedOutput"],
                explanation=tc.get("explanation")
            )
            for tc in question_data.get("testCases", [])
        ]

        return Question(
            id=int(datetime.now().timestamp()),
            title=question_data["title"],
            difficulty=question_data["difficulty"],
            description=question_data["description"],
            testCases=test_cases,
            functionSignature=question_data["functionSignature"],
            solutionTemplate=question_data.get("solutionTemplate"),
            solutionTemplates=question_data.get("solutionTemplates", {}),
            topic=topic
        )

    async def generate_and_save_coding_questions(self, interview_id: str, count: int = 3, difficulty: str = "medium") -> str:
        """
        Generate coding questions and save all in a single MongoDB document.
        """
        questions = self.generate_coding_questions(count, difficulty)
        print(questions)
        if not questions:
            raise ValueError("No questions were generated")

        logger.info(f"Saving {len(questions)} questions for interview_id={interview_id}")
        doc_id = await save_coding_questions(questions, interview_id)
        return doc_id


# Singleton instance
coding_questions_service = CodingQuestionsGenerationService()
