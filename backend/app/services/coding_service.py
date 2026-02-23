import json
import asyncio
import httpx
from typing import List, Dict, Any

from app.models.code import TestCase, TestResult


# ==============================
# Judge0 Configuration
# ==============================

JUDGE0_URL = "https://ce.judge0.com"

# Judge0 Language IDs
JUDGE0_LANGUAGE_IDS = {
    "python": 71,
    "javascript": 63,
    "java": 62,
    "csharp": 51,
    "cpp": 54
}

SUPPORTED_LANGUAGES = list(JUDGE0_LANGUAGE_IDS.keys())


# ==============================
# Coding Service
# ==============================

class CodingService:
    """Service for executing and evaluating code using Judge0"""

    # ----------------------------------------------------
    # Execute Code Using Judge0 Public API
    # ----------------------------------------------------
    async def execute_code(self, language: str, source_code: str) -> Dict[str, Any]:

        language = language.lower()

        if language not in SUPPORTED_LANGUAGES:
            raise ValueError(f"Language '{language}' is not supported")

        language_id = JUDGE0_LANGUAGE_IDS[language]

        async with httpx.AsyncClient(timeout=30.0) as client:

            # Step 1: Create submission
            submission_response = await client.post(
                f"{JUDGE0_URL}/submissions?base64_encoded=false&wait=false",
                json={
                    "source_code": source_code,
                    "language_id": language_id,
                    "stdin": ""
                }
            )

            submission_response.raise_for_status()
            token = submission_response.json()["token"]

            # Step 2: Poll for result
            while True:
                result_response = await client.get(
                    f"{JUDGE0_URL}/submissions/{token}?base64_encoded=false"
                )

                result_response.raise_for_status()
                result_data = result_response.json()

                status_id = result_data["status"]["id"]

                # If status > 2 → finished
                if status_id > 2:
                    return result_data

                await asyncio.sleep(0.5)

    # ----------------------------------------------------
    # Create Test Runner Code
    # ----------------------------------------------------
    def create_test_runner_code(
        self,
        language: str,
        user_code: str,
        test_case: TestCase,
        function_signature: str
    ) -> str:

        input_value = test_case.input

        if language == "javascript":
            function_name = function_signature.split(' ')[1].split('(')[0]
            return f"""
{user_code}

const result = {function_name}({input_value});
console.log(JSON.stringify(result));
"""

        elif language == "python":
            if function_signature.startswith("def "):
                function_name = function_signature.split('(')[0].replace("def ", "").strip()
            else:
                function_name = function_signature.split(' ')[1].split('(')[0]

            return f"""
{user_code}

import json

try:
    result = {function_name}({input_value})
    print(json.dumps(result))
except Exception as e:
    print("ERROR:", str(e))
"""

        elif language == "java":
            function_name = function_signature.split(' ')[2].split('(')[0]
            return f"""
{user_code}

public class Main {{
    public static void main(String[] args) {{
        Solution solution = new Solution();
        System.out.println(solution.{function_name}({input_value}));
    }}
}}
"""

        elif language == "csharp":
            function_name = function_signature.split(' ')[2].split('(')[0]
            return f"""
{user_code}

using System;

class Program {{
    static void Main() {{
        var result = Solution.{function_name}({input_value});
        Console.WriteLine(result);
    }}
}}
"""

        elif language == "cpp":
            return f"""
{user_code}

int main() {{
    std::cout << solution({input_value});
    return 0;
}}
"""

        return user_code

    # ----------------------------------------------------
    # Evaluate Code Against Test Case
    # ----------------------------------------------------
    async def evaluate_code(
        self,
        code: str,
        test_case: TestCase,
        language: str,
        function_signature: str
    ) -> TestResult:

        language = language.lower()

        if language not in SUPPORTED_LANGUAGES:
            return TestResult(
                input=test_case.input,
                expectedOutput=test_case.expectedOutput,
                actualOutput=None,
                passed=False,
                explanation=test_case.explanation,
                error=f"Language '{language}' not supported"
            )

        try:
            test_runner_code = self.create_test_runner_code(
                language,
                code,
                test_case,
                function_signature
            )

            response = await self.execute_code(language, test_runner_code)

            stdout = response.get("stdout")
            stderr = response.get("stderr")
            status_desc = response["status"]["description"]

            if stderr:
                return TestResult(
                    input=test_case.input,
                    expectedOutput=test_case.expectedOutput,
                    actualOutput=None,
                    passed=False,
                    explanation=test_case.explanation,
                    error=stderr
                )

            if not stdout:
                return TestResult(
                    input=test_case.input,
                    expectedOutput=test_case.expectedOutput,
                    actualOutput=None,
                    passed=False,
                    explanation=test_case.explanation,
                    error=f"Execution failed: {status_desc}"
                )

            output = stdout.strip()

            # Try JSON parsing
            try:
                output_json = json.loads(output)
                output = json.dumps(output_json)
            except json.JSONDecodeError:
                pass

            try:
                expected_json = json.loads(test_case.expectedOutput)
                expected_output = json.dumps(expected_json)
            except json.JSONDecodeError:
                expected_output = test_case.expectedOutput

            passed = output == expected_output

            return TestResult(
                input=test_case.input,
                expectedOutput=test_case.expectedOutput,
                actualOutput=output,
                passed=passed,
                explanation=test_case.explanation,
                error=None
            )

        except Exception as e:
            return TestResult(
                input=test_case.input,
                expectedOutput=test_case.expectedOutput,
                actualOutput=None,
                passed=False,
                explanation=test_case.explanation,
                error=str(e)
            )

    # ----------------------------------------------------
    # Run Multiple Test Cases
    # ----------------------------------------------------
    async def run_test_cases(
        self,
        code: str,
        test_cases: List[TestCase],
        language: str,
        function_signature: str
    ) -> List[TestResult]:

        results = []

        for test_case in test_cases:
            result = await self.evaluate_code(
                code,
                test_case,
                language,
                function_signature
            )
            results.append(result)

        return results


# Singleton instance
coding_service = CodingService()