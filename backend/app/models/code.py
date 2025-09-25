from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CodeFile(BaseModel):
    content: str = Field(..., description="Content of the code file")

class CodeExecutionRequest(BaseModel):
    language: str = Field(..., description="Programming language")
    version: Optional[str] = Field(None, description="Language version")
    files: List[CodeFile] = Field(..., description="List of code files to execute")

class CodeExecutionResponse(BaseModel):
    run: Dict[str, Any] = Field(..., description="Execution result")

class TestCase(BaseModel):
    input: str = Field(..., description="Input for the test case")
    expectedOutput: str = Field(..., description="Expected output for the test case")
    explanation: Optional[str] = Field(None, description="Explanation of the test case")

class TestResult(BaseModel):
    input: str = Field(..., description="Input used for the test")
    expectedOutput: str = Field(..., description="Expected output")
    actualOutput: Optional[str] = Field(None, description="Actual output")
    passed: bool = Field(..., description="Whether the test passed")
    explanation: Optional[str] = Field(None, description="Explanation of the test case")
    error: Optional[str] = Field(None, description="Error message if any")

class CodeEvaluationRequest(BaseModel):
    code: str = Field(..., description="User's code")
    testCases: List[TestCase] = Field(..., description="Test cases to evaluate")
    language: str = Field(..., description="Programming language")
    functionSignature: str = Field(..., description="Function signature")

class CodeEvaluationResponse(BaseModel):
    results: List[TestResult] = Field(..., description="Test results")