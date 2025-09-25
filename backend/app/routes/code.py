from fastapi import APIRouter, HTTPException
from typing import List

from app.models.code import (
    CodeExecutionRequest,
    CodeExecutionResponse,
    CodeEvaluationRequest,
    CodeEvaluationResponse,
    TestResult
)
from app.services.coding_service import coding_service

router = APIRouter()

@router.post("/execute", response_model=CodeExecutionResponse)
async def execute_code(request: CodeExecutionRequest):
    """
    Execute code in the specified language
    """
    try:
        # Extract the code from the first file
        source_code = request.files[0].content
        
        # Execute the code
        result = await coding_service.execute_code(request.language, source_code)
        
        return {"run": result["run"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate", response_model=CodeEvaluationResponse)
async def evaluate_code(request: CodeEvaluationRequest):
    """
    Evaluate code against test cases
    """
    try:
        # Run the test cases
        results = await coding_service.run_test_cases(
            request.code,
            request.testCases,
            request.language,
            request.functionSignature
        )
        
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))