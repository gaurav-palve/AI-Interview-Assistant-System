import json
import random
import asyncio
import logging
from datetime import datetime
from typing import List
from langchain_core.messages import HumanMessage
from app.models.question import Question, TestCase
from app.database import save_coding_questions
from app.llm_models.openai_llm import get_openai_llm

logger = logging.getLogger(__name__)

# Topics and difficulty levels
QUESTION_TOPICS = [
    "string manipulation", "array operations", "mathematical algorithms",
    "sorting algorithms", "searching algorithms",
     "stacks", "queues", "bit manipulation", "list",
    "dictionary", "set"
]

DIFFICULTY_LEVELS = ["easy", "medium", "hard"]


class CodingQuestionsGenerationService:
    def __init__(self):
        # Make sure your get_openai_llm() returns a model supporting async calls (like gpt-4o, gpt-3.5-turbo)
        self.llm = get_openai_llm()

    # 🧩 Single Question Generator (prompt unchanged)
    async def _generate_single_question_async(self, difficulty: str, topic: str):
        timestamp = int(datetime.now().timestamp())
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
2. Ensure all keys are exactly as above.
3. Include exactly 5 test cases.
4. Keep all strings properly quoted.
5. Use random seed: {random_seed}, timestamp: {timestamp}.
6. IMPORTANT: For solutionTemplate and solutionTemplates, provide ONLY empty function skeletons WITHOUT any implementation.
7. DO NOT include the actual solution.
8. CRITICAL: Ensure proper line breaks using \\n.
"""

        try:
            # Async call for parallel execution
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
        except Exception as e:
            logger.error(f"Error generating question for topic '{topic}': {e}")
            raise

    # 🧠 Parallelized generation of multiple questions
    async def generate_coding_questions(self, count=3, difficulty="medium") -> List[Question]:
        valid_difficulty = difficulty.lower() if difficulty.lower() in DIFFICULTY_LEVELS else "easy"
        selected_topics = random.sample(QUESTION_TOPICS, k=min(count, len(QUESTION_TOPICS)))

        # Launch all async calls together (parallel)
        tasks = [self._generate_single_question_async(valid_difficulty, topic) for topic in selected_topics]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        questions = []
        for topic, data in zip(selected_topics, results):
            if isinstance(data, Exception):
                logger.warning(f"Skipping topic '{topic}' due to generation error.")
                continue

            try:
                test_cases = [
                    TestCase(
                        input=tc["input"],
                        expectedOutput=tc["expectedOutput"],
                        explanation=tc.get("explanation")
                    )
                    for tc in data.get("testCases", [])
                ]

                question = Question(
                    id=int(datetime.now().timestamp()),
                    title=data["title"],
                    difficulty=data["difficulty"],
                    description=data["description"],
                    testCases=test_cases,
                    functionSignature=data["functionSignature"],
                    solutionTemplate=data.get("solutionTemplate"),
                    solutionTemplates=data.get("solutionTemplates", {}),
                    topic=topic
                )
                questions.append(question)

            except Exception as e:
                logger.error(f"Error building question object for topic '{topic}': {e}")

        return questions

    # 💾 Generate and save in parallel
    async def generate_and_save_coding_questions(self, interview_id: str, count=3, difficulty="medium") -> str:
        questions = await self.generate_coding_questions(count, difficulty)
        if not questions:
            raise ValueError("No questions were generated successfully.")
        logger.info(f"Saving {len(questions)} questions for interview ID: {interview_id}")
        return await save_coding_questions(questions, interview_id)


# Singleton instance
coding_questions_service = CodingQuestionsGenerationService()
