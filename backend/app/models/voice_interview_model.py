from typing import Dict, Any, Optional
from datetime import datetime, timezone

def voice_interview_session_dict(
    interview_id: str,
    candidate_id: str,
    session_id: str,
    status: str = "pending",
    conversation_id: Optional[str] = None
):
    """Create a voice interview session document"""
    return {
        "interview_id": interview_id,
        "candidate_id": candidate_id,
        "session_id": session_id,
        "status": status,
        "started_at": None,
        "completed_at": None,
        "duration_seconds": None,
        "conversation_id": conversation_id,   # 👈 unique from ElevenLabs each run
        "transcript": None,
        "communication_score": None,
        "technical_score": None,
        "confidence_score": None,
        "overall_score": None,
        "feedback": None,
        "audio_file_path": None,
        "metadata": {},
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

def update_voice_session_dict(
    session_data: Dict[str, Any],
    updates: Dict[str, Any]
) -> Dict[str, Any]:
    """Update a voice interview session document with new values"""
    updated_session = session_data.copy()
    updated_session.update(updates)
    updated_session["updated_at"] = datetime.now(timezone.utc)
    return updated_session
