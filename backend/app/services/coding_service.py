import json
import httpx
from typing import List, Dict, Any, Optional

from app.config import settings
from app.models.code import TestCase, TestResult

# Language versions
LANGUAGE_VERSIONS = {
    "javascript": "18.15.0",
    "python": "3.10.0",
    "java": "15.0.2",
    "csharp": "6.12.0",
    "php": "8.2.3",
    "typescript": "5.0.3"
}

# Supported languages
SUPPORTED_LANGUAGES = list(LANGUAGE_VERSIONS.keys())

class CodingService:
    """Service for executing and evaluating code"""
    
    async def execute_code(self, language: str, source_code: str) -> Dict[str, Any]:
        """
        Execute code using the Piston API
        
        Args:
            language: Programming language
            source_code: Source code to execute
            
        Returns:
            Execution result
        """
        print(f"Executing code in language: {language}")
        print(f"Source code: {source_code[:100]}...")  # Print first 100 chars of source code
        # Normalize language
        language = language.lower()
        
        # Check if language is supported
        if language not in SUPPORTED_LANGUAGES:
            raise ValueError(f"Language '{language}' is not supported")
        
        # Prepare request payload
        payload = {
            "language": language,
            "version": LANGUAGE_VERSIONS.get(language),
            "files": [
                {
                    "content": source_code
                }
            ]
        }
        
        # Make request to Piston API
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{settings.PISTON_API_URL}/execute", json=payload)
            response.raise_for_status()
            return response.json()
    
    async def evaluate_javascript(self, code: str, test_case: TestCase, function_signature: str) -> TestResult:
        """
        Evaluate JavaScript code against a test case
        
        Args:
            code: User's code
            test_case: Test case to evaluate
            function_signature: Function signature
            
        Returns:
            Test result
        """
        try:
            # Extract function name from signature
            function_name = function_signature.split(' ')[1].split('(')[0]
            
            # Create test runner code
            test_runner_code = f"""
                {code}
                
                // Get function name from signature
                const functionName = "{function_name}";
                
                // Call the function with test input
                const result = eval(`${{functionName}}({test_case.input})`);
                
                // Print the result
                console.log(JSON.stringify(result));
            """
            
            # Execute code
            response = await self.execute_code("javascript", test_runner_code)
            
            # Parse the output
            output = response["run"]["output"].strip()
            
            # Try to parse the output as JSON if possible
            try:
                output_json = json.loads(output)
                # Convert to string for comparison
                output = json.dumps(output_json)
            except json.JSONDecodeError:
                # If parsing fails, use the raw output
                pass
            
            # Parse the expected output
            try:
                expected_output_json = json.loads(test_case.expectedOutput)
                # Convert to string for comparison
                expected_output = json.dumps(expected_output_json)
            except json.JSONDecodeError:
                # If parsing fails, use the raw expected output
                expected_output = test_case.expectedOutput
            
            # Check if the output matches the expected output
            passed = output == expected_output
            
            return TestResult(
                input=test_case.input,
                expectedOutput=test_case.expectedOutput,
                actualOutput=output,
                passed=passed,
                explanation=test_case.explanation,
                error=response["run"]["stderr"] if response["run"]["stderr"] else None
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
    
    def create_test_runner_code(self, language: str, user_code: str, test_case: TestCase, function_signature: str) -> str:
        """
        Create test runner code for different languages
        
        Args:
            language: Programming language
            user_code: User's code
            test_case: Test case
            function_signature: Function signature
            
        Returns:
            Test runner code
        """
        input_value = test_case.input
        
        if language == "javascript":
            function_name = function_signature.split(' ')[1].split('(')[0]
            return f"""
                {user_code}
                
                // Get function name from signature
                const functionName = "{function_name}";
                
                // Call the function with test input
                const result = eval(`${{functionName}}({input_value})`);
                
                // Print the result
                console.log(JSON.stringify(result));
            """
        elif language == "python":
            # Extract function name from Python signature
            py_func_name = ""
            if function_signature.startswith("def "):
                # Already in Python format
                py_func_name = function_signature.split('(')[0].replace("def ", "").strip()
            else:
                # Convert from JavaScript format to Python style (camelCase to snake_case)
                js_func_name = function_signature.split(' ')[1].split('(')[0]
                # Convert camelCase to snake_case
                py_func_name = ''.join(['_' + c.lower() if c.isupper() else c for c in js_func_name]).lstrip('_')
            
            # Log for debugging
            print(f"Original function signature: {function_signature}")
            print(f"Python function name: {py_func_name}")
            print(f"Input value: {input_value}")
            
            return f"""
{user_code}

# Call the function with test input
result = {py_func_name}({input_value.replace('"', "'")})

# Print the result
import json
print(json.dumps(result))
            """
        elif language == "java":
            # For Java, we need to extract the method name from the user's code
            # since Java methods are defined inside classes
            java_func_name = ""
            if function_signature.startswith("public") or function_signature.startswith("private") or function_signature.startswith("protected"):
                # Already in Java format
                java_func_name = function_signature.split(' ')[2].split('(')[0]
            else:
                # Convert from JavaScript format
                java_func_name = function_signature.split(' ')[1].split('(')[0]
            
            print(f"Original function signature: {function_signature}")
            print(f"Java function name: {java_func_name}")
            
            return f"""
{user_code}

public class Main {{
    public static void main(String[] args) {{
        Solution solution = new Solution();
        System.out.println(solution.{java_func_name}({input_value}));
    }}
}}
            """
        elif language == "csharp":
            # For C#, we need to extract the method name and possibly capitalize it
            csharp_func_name = ""
            if function_signature.startswith("public") or function_signature.startswith("private") or function_signature.startswith("protected"):
                # Already in C# format
                csharp_func_name = function_signature.split(' ')[2].split('(')[0]
            else:
                # Convert from JavaScript format - C# methods are typically PascalCase
                js_func_name = function_signature.split(' ')[1].split('(')[0]
                csharp_func_name = js_func_name[0].upper() + js_func_name[1:]
            
            print(f"Original function signature: {function_signature}")
            print(f"C# function name: {csharp_func_name}")
            
            return f"""
{user_code}

using System;

class Program {{
    static void Main() {{
        var result = Solution.{csharp_func_name}({input_value});
        Console.WriteLine(result);
    }}
}}
            """
        elif language == "php":
            # For PHP, function names are typically lowercase with underscores
            php_func_name = ""
            if function_signature.startswith("function"):
                # Already in PHP format
                php_func_name = function_signature.split(' ')[1].split('(')[0]
            else:
                # Convert from JavaScript format
                js_func_name = function_signature.split(' ')[1].split('(')[0]
                php_func_name = js_func_name.lower()
            
            print(f"Original function signature: {function_signature}")
            print(f"PHP function name: {php_func_name}")
            
            return f"""
{user_code}

// Call the function with test input
$result = {php_func_name}({input_value});

// Print the result
echo json_encode($result);
            """
        else:
            return user_code
    
    async def evaluate_code(self, code: str, test_case: TestCase, language: str, function_signature: str) -> TestResult:
        """
        Evaluate code against a test case
        
        Args:
            code: User's code
            test_case: Test case to evaluate
            language: Programming language
            function_signature: Function signature
            
        Returns:
            Test result
        """
        # Normalize language
        language = language.lower()
        
        # Check if language is supported
        if language not in SUPPORTED_LANGUAGES:
            return TestResult(
                input=test_case.input,
                expectedOutput=test_case.expectedOutput,
                actualOutput=None,
                passed=False,
                explanation=test_case.explanation,
                error=f"Language '{language}' is not supported for evaluation"
            )
        
        try:
            # Create test runner code
            test_runner_code = self.create_test_runner_code(language, code, test_case, function_signature)
            
            # Execute code with the specified language
            print(f"Executing code in language: {language}")
            response = await self.execute_code(language, test_runner_code)
            
            # Parse the output
            output = response["run"]["output"].strip()
            
            # Try to parse the output as JSON if possible
            try:
                output_json = json.loads(output)
                # Convert to string for comparison
                output = json.dumps(output_json)
            except json.JSONDecodeError:
                # If parsing fails, use the raw output
                pass
            
            # Parse the expected output
            try:
                expected_output_json = json.loads(test_case.expectedOutput)
                # Convert to string for comparison
                expected_output = json.dumps(expected_output_json)
            except json.JSONDecodeError:
                # If parsing fails, use the raw expected output
                expected_output = test_case.expectedOutput
            
            # Check if the output matches the expected output
            passed = output == expected_output
            
            return TestResult(
                input=test_case.input,
                expectedOutput=test_case.expectedOutput,
                actualOutput=output,
                passed=passed,
                explanation=test_case.explanation,
                error=response["run"]["stderr"] if response["run"]["stderr"] else None
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
    
    async def run_test_cases(self, code: str, test_cases: List[TestCase], language: str, function_signature: str) -> List[TestResult]:
        """
        Run all test cases for a question
        
        Args:
            code: User's code
            test_cases: Test cases to evaluate
            language: Programming language
            function_signature: Function signature
            
        Returns:
            Test results
        """
        results = []
        for test_case in test_cases:
            result = await self.evaluate_code(code, test_case, language, function_signature)
            results.append(result)
        return results

# Create a singleton instance
coding_service = CodingService()