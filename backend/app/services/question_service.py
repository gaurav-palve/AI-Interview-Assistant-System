import json
import random
import time
from typing import List, Dict, Any, Optional
import httpx
from datetime import datetime

from app.config import settings
from app.models.question import Question, TestCase


# Question topics
QUESTION_TOPICS = [
    "string manipulation",
    "array operations",
    "mathematical algorithms",
    "sorting algorithms",
    "searching algorithms",
    "dynamic programming",
    "recursion",
    "stacks",
    "queues",
    "bit manipulation",
]

# Difficulty levels
DIFFICULTY_LEVELS = ["easy", "medium", "hard"]

class QuestionService:
    """Service for generating coding questions"""
    
    async def generate_question(self, difficulty: str = "easy", topic: Optional[str] = None) -> Question:
        """
        Generate a programming question using OpenAI's API
        
        Args:
            difficulty: Difficulty level of the question
            topic: Optional topic for the question
            
        Returns:
            Generated question with test cases
        """
        try:
            # Validate difficulty
            valid_difficulty = difficulty.lower() if difficulty.lower() in DIFFICULTY_LEVELS else "easy"
            
            # Select a random topic if none provided
            question_topic = topic or random.choice(QUESTION_TOPICS)
            
            # Add randomness to ensure different questions each time
            timestamp = int(time.time())
            random_seed = random.randint(0, 10000)
            
            # Create the prompt for the LLM
            prompt = f"""
                Generate a {valid_difficulty} level programming question about {question_topic} with the following format:
                
                1. A clear problem statement that is language-agnostic (can be solved in any programming language)
                2. 5 test cases with inputs and expected outputs
                3. A brief explanation for each test case
                
                Format the response as a JSON object with the following structure:
                {{
                    "title": "Question title",
                    "difficulty": "{valid_difficulty}",
                    "description": "Detailed problem description",
                    "testCases": [
                        {{
                            "input": "Input value as a string",
                            "expectedOutput": "Expected output as a string",
                            "explanation": "Explanation of this test case"
                        }}
                        // More test cases...
                    ],
                    "functionSignature": "function solveProblem(params)",
                    "solutionTemplate": "function solveProblem(params) {{\\n  // Your code here\\n}}"
                }}
                
                Make sure the question:
                1. Is appropriate for {valid_difficulty} level
                2. Is NOT language-specific (should be solvable in any programming language)
                3. Has a clear and concise problem statement
                4. Has well-defined inputs and outputs
                5. Has diverse test cases that cover different scenarios
                
                Use the random seed {random_seed} and timestamp {timestamp} to ensure this question is unique.
            """
            
            # Call the OpenAI API
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
            }
            
            payload = {
                "model": "gpt-4",
                "messages": [
                    {"role": "system", "content": "You are a programming instructor creating coding challenges that can be solved in any programming language."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.9,
                "max_tokens": 1000
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
            
            # Parse the response
            content = data["choices"][0]["message"]["content"]
            question_data = json.loads(content)
            
            # Create test cases
            test_cases = []
            for tc in question_data.get("testCases", []):
                test_cases.append(TestCase(
                    input=tc["input"],
                    expectedOutput=tc["expectedOutput"],
                    explanation=tc.get("explanation")
                ))
            
            # Create solution templates for different languages if they don't exist
            solution_templates = {}
            if "solutionTemplates" not in question_data:
                function_name = question_data["functionSignature"].split(' ')[1].split('(')[0]
                params = question_data["functionSignature"].split('(')[1].split(')')[0]
                
                solution_templates = {
                    "javascript": f"function {function_name}({params}) {{\n  // Your code here\n  return null;\n}}",
                    "python": f"def {function_name.lower()}({params}):\n    # Your code here\n    return None",
                    "java": f"public class Solution {{\n    public static {question_data['functionSignature']} {{\n        // Your code here\n        return null;\n    }}\n}}",
                    "csharp": f"public class Solution {{\n    public static {question_data['functionSignature']} {{\n        // Your code here\n        return null;\n    }}\n}}",
                    "php": f"<?php\nfunction {function_name}({params}) {{\n    // Your code here\n    return null;\n}}\n?>"
                }
            else:
                solution_templates = question_data["solutionTemplates"]
            
            # Create the question object
            question = Question(
                id=int(datetime.now().timestamp()),
                title=question_data["title"],
                difficulty=question_data["difficulty"],
                description=question_data["description"],
                testCases=test_cases,
                functionSignature=question_data["functionSignature"],
                solutionTemplate=question_data.get("solutionTemplate"),
                solutionTemplates=solution_templates,
                topic=question_topic
            )
            
            return question
        except Exception as e:
            # Return a fallback question if the API call fails
            return await self.generate_fallback_question(difficulty, topic)
    
    async def generate_multiple_questions(self, count: int = 3, difficulty: str = "easy") -> List[Question]:
        """
        Generate multiple questions
        
        Args:
            count: Number of questions to generate
            difficulty: Difficulty level
            
        Returns:
            Array of generated questions
        """
        try:
            questions = []
            
            # Select random topics to ensure variety
            selected_topics = []
            available_topics = QUESTION_TOPICS.copy()
            
            while len(selected_topics) < count and available_topics:
                random_topic = random.choice(available_topics)
                selected_topics.append(random_topic)
                available_topics.remove(random_topic)
            
            # If we need more topics than available, allow repeats
            while len(selected_topics) < count:
                random_topic = random.choice(QUESTION_TOPICS)
                selected_topics.append(random_topic)
            
            # Generate questions with different topics
            for i in range(count):
                question = await self.generate_question(difficulty, selected_topics[i])
                questions.append(question)
            
            return questions
        except Exception as e:
            # Return fallback questions
            return [
                await self.generate_fallback_question("easy", "string manipulation"),
                await self.generate_fallback_question("easy", "array operations"),
                await self.generate_fallback_question("easy", "mathematical algorithms")
            ]
    
    async def generate_fallback_question(self, difficulty: str = "easy", topic: str = "string manipulation") -> Question:
        """
        Generate a fallback question if the API call fails
        
        Args:
            difficulty: Difficulty level
            topic: Question topic
            
        Returns:
            A fallback question
        """
        # Predefined fallback questions in case the API fails
        fallback_questions = {
            "string manipulation": [
                {
                    "title": "Reverse a String",
                    "difficulty": "easy",
                    "description": "Write a function that reverses a string.\n\nExample:\nInput: \"hello\"\nOutput: \"olleh\"\n\nYour function should take a string as input and return the reversed string.",
                    "testCases": [
                        {
                            "input": '"hello"',
                            "expectedOutput": '"olleh"',
                            "explanation": "Reversing the string 'hello' gives 'olleh'"
                        },
                        {
                            "input": '"JavaScript"',
                            "expectedOutput": '"tpircSavaJ"',
                            "explanation": "Reversing the string 'JavaScript' gives 'tpircSavaJ'"
                        },
                        {
                            "input": '"12345"',
                            "expectedOutput": '"54321"',
                            "explanation": "Reversing the string '12345' gives '54321'"
                        },
                        {
                            "input": '"a"',
                            "expectedOutput": '"a"',
                            "explanation": "A single character string remains the same when reversed"
                        },
                        {
                            "input": '""',
                            "expectedOutput": '""',
                            "explanation": "An empty string remains empty when reversed"
                        }
                    ],
                    "functionSignature": "function reverseString(str)",
                    "solutionTemplate": "function reverseString(str) {\n  // Your code here\n}",
                    "solutionTemplates": {
                        "javascript": "function reverseString(str) {\n  // Your code here\n  return str;\n}",
                        "python": "def reverse_string(str):\n    # Your code here\n    return str",
                        "java": "public class Solution {\n    public static String reverseString(String str) {\n        // Your code here\n        return str;\n    }\n}",
                        "csharp": "public class Solution {\n    public static string ReverseString(string str) {\n        // Your code here\n        return str;\n    }\n}",
                        "php": "<?php\nfunction reverseString($str) {\n    // Your code here\n    return $str;\n}\n?>"
                    }
                },
                {
                    "title": "Check Palindrome",
                    "difficulty": "easy",
                    "description": "Write a function that checks if a given string is a palindrome. A palindrome is a word, phrase, number, or other sequence of characters that reads the same forward and backward, ignoring spaces, punctuation, and capitalization.\n\nExample:\nInput: \"racecar\"\nOutput: true\n\nYour function should take a string as input and return a boolean value.",
                    "testCases": [
                        {
                            "input": '"racecar"',
                            "expectedOutput": "true",
                            "explanation": "'racecar' reads the same forward and backward"
                        },
                        {
                            "input": '"hello"',
                            "expectedOutput": "false",
                            "explanation": "'hello' is not a palindrome"
                        },
                        {
                            "input": '"A man a plan a canal Panama"',
                            "expectedOutput": "true",
                            "explanation": "Ignoring spaces and capitalization, this phrase is a palindrome"
                        },
                        {
                            "input": '"12321"',
                            "expectedOutput": "true",
                            "explanation": "This number sequence is a palindrome"
                        },
                        {
                            "input": '""',
                            "expectedOutput": "true",
                            "explanation": "An empty string is considered a palindrome"
                        }
                    ],
                    "functionSignature": "function isPalindrome(str)",
                    "solutionTemplate": "function isPalindrome(str) {\n  // Your code here\n}",
                    "solutionTemplates": {
                        "javascript": "function isPalindrome(str) {\n  // Your code here\n  return false;\n}",
                        "python": "def is_palindrome(str):\n    # Your code here\n    return False",
                        "java": "public class Solution {\n    public static boolean isPalindrome(String str) {\n        // Your code here\n        return false;\n    }\n}",
                        "csharp": "public class Solution {\n    public static bool IsPalindrome(string str) {\n        // Your code here\n        return false;\n    }\n}",
                        "php": "<?php\nfunction isPalindrome($str) {\n    // Your code here\n    return false;\n}\n?>"
                    }
                }
            ],
            "array operations": [
                {
                    "title": "Find the Maximum Number",
                    "difficulty": "easy",
                    "description": "Write a function that finds the maximum number in an array of integers.\n\nExample:\nInput: [3, 7, 2, 9, 1]\nOutput: 9\n\nYour function should take an array of integers as input and return the largest number in the array.",
                    "testCases": [
                        {
                            "input": "[3, 7, 2, 9, 1]",
                            "expectedOutput": "9",
                            "explanation": "The largest number in the array [3, 7, 2, 9, 1] is 9"
                        },
                        {
                            "input": "[10, 20, 30, 40, 50]",
                            "expectedOutput": "50",
                            "explanation": "The largest number in the array [10, 20, 30, 40, 50] is 50"
                        },
                        {
                            "input": "[-5, -2, -10, -1, -8]",
                            "expectedOutput": "-1",
                            "explanation": "The largest number in the array [-5, -2, -10, -1, -8] is -1"
                        },
                        {
                            "input": "[42]",
                            "expectedOutput": "42",
                            "explanation": "In an array with only one element, that element is the largest"
                        },
                        {
                            "input": "[7, 7, 7, 7]",
                            "expectedOutput": "7",
                            "explanation": "When all elements are the same, that value is the largest"
                        }
                    ],
                    "functionSignature": "function findMax(arr)",
                    "solutionTemplate": "function findMax(arr) {\n  // Your code here\n}",
                    "solutionTemplates": {
                        "javascript": "function findMax(arr) {\n  // Your code here\n  return 0;\n}",
                        "python": "def find_max(arr):\n    # Your code here\n    return 0",
                        "java": "public class Solution {\n    public static int findMax(int[] arr) {\n        // Your code here\n        return 0;\n    }\n}",
                        "csharp": "public class Solution {\n    public static int FindMax(int[] arr) {\n        // Your code here\n        return 0;\n    }\n}",
                        "php": "<?php\nfunction findMax($arr) {\n    // Your code here\n    return 0;\n}\n?>"
                    }
                }
            ],
            "mathematical algorithms": [
                {
                    "title": "Factorial Calculator",
                    "difficulty": "easy",
                    "description": "Write a function that calculates the factorial of a non-negative integer. The factorial of a number is the product of all positive integers less than or equal to that number.\n\nExample:\nInput: 5\nOutput: 120\n\nYour function should take a non-negative integer as input and return its factorial.",
                    "testCases": [
                        {
                            "input": "5",
                            "expectedOutput": "120",
                            "explanation": "5! = 5 × 4 × 3 × 2 × 1 = 120"
                        },
                        {
                            "input": "0",
                            "expectedOutput": "1",
                            "explanation": "0! is defined as 1"
                        },
                        {
                            "input": "1",
                            "expectedOutput": "1",
                            "explanation": "1! = 1"
                        },
                        {
                            "input": "10",
                            "expectedOutput": "3628800",
                            "explanation": "10! = 10 × 9 × 8 × 7 × 6 × 5 × 4 × 3 × 2 × 1 = 3628800"
                        },
                        {
                            "input": "3",
                            "expectedOutput": "6",
                            "explanation": "3! = 3 × 2 × 1 = 6"
                        }
                    ],
                    "functionSignature": "function factorial(n)",
                    "solutionTemplate": "function factorial(n) {\n  // Your code here\n}",
                    "solutionTemplates": {
                        "javascript": "function factorial(n) {\n  // Your code here\n  return 0;\n}",
                        "python": "def factorial(n):\n    # Your code here\n    return 0",
                        "java": "public class Solution {\n    public static int factorial(int n) {\n        // Your code here\n        return 0;\n    }\n}",
                        "csharp": "public class Solution {\n    public static int Factorial(int n) {\n        // Your code here\n        return 0;\n    }\n}",
                        "php": "<?php\nfunction factorial($n) {\n    // Your code here\n    return 0;\n}\n?>"
                    }
                }
            ]
        }
        
        # Get questions for the specified topic or default to string manipulation
        topic_questions = fallback_questions.get(topic, fallback_questions["string manipulation"])
        
        # Select a random question from the topic
        random_index = random.randint(0, len(topic_questions) - 1)
        question_data = topic_questions[random_index]
        
        # Create test cases
        test_cases = []
        for tc in question_data["testCases"]:
            test_cases.append(TestCase(
                input=tc["input"],
                expectedOutput=tc["expectedOutput"],
                explanation=tc.get("explanation")
            ))
        
        # Create the question object
        question = Question(
            id=int(datetime.now().timestamp()),
            title=question_data["title"],
            difficulty=question_data["difficulty"],
            description=question_data["description"],
            testCases=test_cases,
            functionSignature=question_data["functionSignature"],
            solutionTemplate=question_data.get("solutionTemplate"),
            solutionTemplates=question_data.get("solutionTemplates"),
            topic=topic
        )
        
        return question

# Create a singleton instance
question_service = QuestionService()