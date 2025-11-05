# backend/app/routes/voice_interview_routes.py
from fastapi import APIRouter, HTTPException
from app.services.voice_interview_service import VoiceInterviewService
from app.database import get_voice_session, get_sessions_by_interview

router = APIRouter(tags=["voice-interviews"])

@router.post("/start")
async def start_voice_interview(payload: dict):
    """
    Start a voice interview session.
    Expected payload: { "interview_id": "...", "candidate_id": "..." }
    """
    try:
        interview_id = payload.get("interview_id")
        candidate_id = payload.get("candidate_id")
        if not (interview_id and candidate_id):
            raise HTTPException(status_code=400, detail="Missing interview_id or candidate_id")

        service = VoiceInterviewService()
        return await service.start_voice_interview(interview_id, candidate_id)
    except Exception as e:
        # Log the full exception for debugging
        import traceback
        print("=== VOICE INTERVIEW START ERROR ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print("Full traceback:")
        traceback.print_exc()
        print("=== END ERROR ===")

        raise HTTPException(status_code=500, detail={
            "error": "Failed to start voice interview",
            "error_type": type(e).__name__,
            "error_message": str(e),
            "debug_info": "Check server logs for full traceback"
        })

@router.post("/stop")
def stop_voice_interview(payload: dict):
    """
    Stop a voice interview session (legacy endpoint).
    Expected payload: { "session_id": "..." }
    """
    try:
        session_id = payload.get("session_id")
        if not session_id:
            raise HTTPException(status_code=400, detail="Missing session_id")

        service = VoiceInterviewService()
        return service.stop_voice_interview_legacy(session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop voice interview: {str(e)}")

@router.post("/session/{session_id}/complete")
async def complete_voice_interview(session_id: str, payload: dict):
    """
    Complete a voice interview session and end the ElevenLabs agent.
    Expected payload: { "duration_seconds": 120 }
    """
    try:
        duration_seconds = payload.get("duration_seconds", 0)

        service = VoiceInterviewService()
        return await service.complete_voice_interview(session_id, duration_seconds)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete voice interview: {str(e)}")

@router.get("/session/{session_id}")
async def get_voice_interview_session(session_id: str):
    """
    Get a voice interview session by ID.
    """
    try:
        session = await get_voice_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Voice interview session not found")

        return session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get voice interview session: {str(e)}")

@router.get("/interview/{interview_id}")
async def get_voice_sessions_by_interview(interview_id: str):
    """
    Get all voice interview sessions for an interview.
    """
    try:
        sessions = await get_sessions_by_interview(interview_id)
        return {"sessions": sessions, "total": len(sessions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get voice interview sessions: {str(e)}")
