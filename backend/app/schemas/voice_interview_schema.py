# app/schemas/voice_interview_schema.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class VoiceInterviewSessionCreate(BaseModel):
    interview_id: str
    candidate_id: str

class VoiceInterviewSessionUpdate(BaseModel):
    status: Optional[str] = None
    transcript: Optional[str] = None
    communication_score: Optional[float] = None
    technical_score: Optional[float] = None
    confidence_score: Optional[float] = None
    overall_score: Optional[float] = None
    feedback: Optional[str] = None
    duration_seconds: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class VoiceInterviewSessionResponse(BaseModel):
    interview_id: str
    candidate_id: str
    session_id: str
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    agent_id: Optional[str] = None
    conversation_id: Optional[str] = None
    transcript: Optional[str] = None
    communication_score: Optional[float] = None
    technical_score: Optional[float] = None
    confidence_score: Optional[float] = None
    overall_score: Optional[float] = None
    feedback: Optional[str] = None
    audio_file_path: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        
    @classmethod
    def from_orm(cls, obj):
        """Convert MongoDB document to Pydantic model"""
        if isinstance(obj, dict):
            return cls(**obj)
        return cls.model_validate(obj)

class StartVoiceInterviewRequest(BaseModel):
    interview_id: str
    candidate_id: str

class StartVoiceInterviewResponse(BaseModel):
    session_id: str
    agent_id: str
    conversation_id: Optional[str] = None
    websocket_url: Optional[str] = ""
    status: str
