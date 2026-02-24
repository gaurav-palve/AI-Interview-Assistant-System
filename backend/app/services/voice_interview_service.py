import uuid
import json
from datetime import datetime, timezone
from app.llm_models.elevenlabs_agent import ElevenLabsVoiceAgent
from app.llm_models.openai_llm import OpenAILLM
from app.models.voice_interview_model import voice_interview_session_dict, update_voice_session_dict
from app.database import create_voice_session, update_voice_session, get_voice_session, create_voice_session_with_id
 
 
class VoiceInterviewService:
    _shared_agent = None  # Singleton instance
 
    @classmethod
    def get_shared_agent(cls):
        """Get the shared ElevenLabs agent instance (singleton pattern)"""
        if cls._shared_agent is None:
            cls._shared_agent = ElevenLabsVoiceAgent()
        return cls._shared_agent
 
    def __init__(self):
        self.agent = self.get_shared_agent()
 
    async def start_voice_interview(self, interview_id, candidate_id):
        """
        Start a voice interview session.
        Creates a DB record and fetches a signed URL from ElevenLabs
        for the frontend to use with the client-side SDK.
        """
        session_id = str(uuid.uuid4())
        print(f"Generated session_id: {session_id}")
 
        try:
            # Get signed URL from ElevenLabs
            print("Fetching ElevenLabs signed URL...")
            signed_url = self.agent.get_signed_url()
            print("Successfully obtained signed URL")
 
            # Save session to database
            saved_session = await create_voice_session_with_id(interview_id, candidate_id, session_id)
            print(f"Voice interview session created and saved: {session_id}")
 
            # Return session info + signed URL for client-side WebRTC
            saved_session["signed_url"] = signed_url
            saved_session["session_id"] = session_id
            saved_session["status"] = "active"
            return saved_session
 
        except Exception as e:
            print(f"Error starting voice interview with session_id {session_id}: {str(e)}")
            raise
 
    def stop_voice_interview_legacy(self, session_id):
        """
        Stop voice interview (legacy endpoint).
        """
        return {
            "message": "Voice interview stopped successfully",
            "session_id": session_id
        }
 
    async def complete_voice_interview(self, session_id, duration_seconds, transcript_data=None):
        """
        Complete voice interview session.
        Accepts transcript data from the frontend (collected via client-side SDK callbacks),
        analyzes it with OpenAI, and saves results to the database.
        """
        # Use provided transcript or empty list
        if transcript_data is None:
            transcript_data = []
 
        # Normalize transcript entries (frontend sends {role, text}, add timestamps)
        normalized_transcript = []
        for entry in transcript_data:
            normalized_transcript.append({
                'role': entry.get('role', 'user'),
                'text': entry.get('text', ''),
                'timestamp': datetime.now(timezone.utc)
            })
 
        # Analyze transcript and calculate scores
        analysis = self._analyze_interview_transcript(normalized_transcript, duration_seconds)
 
        # Prepare update data for database
        update_data = {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc),
            "duration_seconds": duration_seconds,
            "transcript": normalized_transcript,
            "overall_score": analysis.get("overall_score", 0.0),
            "communication_score": analysis.get("communication_score", 0.0),
            "technical_score": analysis.get("technical_score", 0.0),
            "confidence_score": analysis.get("confidence_score", 0.0),
            "word_count": analysis.get("word_count", 0),
            "sentence_count": analysis.get("sentence_count", 0),
            "response_count": analysis.get("response_count", 0),
            "feedback": analysis.get("feedback", "Analysis completed.")
        }
 
        # Save to database
        try:
            updated_session = await update_voice_session(session_id, update_data)
            print(f"Voice interview session completed and saved: {session_id}")
        except Exception as e:
            print(f"Failed to save voice interview completion to database: {e}")
 
        # Create completion response
        completed_session = {
            "session_id": session_id,
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "duration_seconds": duration_seconds,
            "message": "Voice interview completed successfully",
            **analysis
        }
 
        return completed_session
 
    def _analyze_interview_transcript(self, transcript_data, duration_seconds):
        """
        Analyze interview transcript using OpenAI for intelligent evaluation
        """
        if not transcript_data:
            return self._get_empty_analysis(duration_seconds)
 
        # Extract user responses only
        user_messages = [msg for msg in transcript_data if msg['role'] == 'user']
        agent_messages = [msg for msg in transcript_data if msg['role'] == 'agent']
 
        # Basic metrics
        word_count = sum(len(msg['text'].split()) for msg in user_messages)
        sentence_count = sum(msg['text'].count('.') + msg['text'].count('!') + msg['text'].count('?')
                           for msg in user_messages)
        response_count = len(user_messages)
 
        # Use OpenAI for intelligent evaluation
        ai_evaluation = self._evaluate_with_openai(transcript_data, duration_seconds)
 
        return {
            "overall_score": ai_evaluation.get("overall_score", 0.0),
            "communication_score": ai_evaluation.get("communication_score", 0.0),
            "technical_score": ai_evaluation.get("technical_score", 0.0),
            "confidence_score": ai_evaluation.get("confidence_score", 0.0),
            "word_count": word_count,
            "sentence_count": max(1, sentence_count),
            "response_count": response_count,
            "feedback": ai_evaluation.get("feedback", "Analysis completed."),
            "transcript": transcript_data
        }
 
    def _evaluate_with_openai(self, transcript_data, duration_seconds):
        """
        Use OpenAI to intelligently evaluate the interview transcript
        """
        try:
            openai_llm = OpenAILLM()
            formatted_transcript = self._format_transcript_for_ai(transcript_data)
            evaluation_prompt = self._create_evaluation_prompt(formatted_transcript, duration_seconds)
            ai_response = openai_llm.generate_response(evaluation_prompt)
            return self._parse_ai_evaluation_response(ai_response)
        except Exception as e:
            print(f"OpenAI evaluation failed: {e}")
            return self._fallback_evaluation(transcript_data, duration_seconds)
 
    def _format_transcript_for_ai(self, transcript_data):
        """Format transcript data for AI evaluation"""
        formatted_lines = []
        for i, msg in enumerate(transcript_data):
            role = "Interviewer" if msg['role'] == 'agent' else "Candidate"
            text = msg['text']
            formatted_lines.append(f"[{i+1}] {role}: {text}")
        return "\n".join(formatted_lines)
 
    def _create_evaluation_prompt(self, transcript, duration_seconds):
        """Create the evaluation prompt for OpenAI"""
        duration_minutes = duration_seconds // 60
 
        return f"""You are an expert interview evaluator. Analyze this interview transcript and provide detailed scores and feedback.
 
INTERVIEW TRANSCRIPT:
{transcript}
 
INTERVIEW DURATION: {duration_minutes} minutes
 
TASK:
Evaluate the candidate's performance across these dimensions:
1. Communication Skills (1-10): Clarity, structure, articulation, response quality
2. Technical Skills (1-10): If this is a technical interview, evaluate technical knowledge and problem-solving. If this is behavioral/personality assessment, score based on relevant behavioral competencies.
3. Confidence Level (1-10): Assertiveness, nervousness indicators, response directness
 
Consider:
- Response length and completeness
- Hesitation patterns (um, uh, you know, etc.)
- Direct vs vague answers
- Engagement level
- Professional communication
- Context-appropriate responses
 
Return your analysis in this exact JSON format:
{{
  "communication_score": 7.5,
  "technical_score": 0.0,
  "confidence_score": 6.2,
  "overall_score": 4.6,
  "feedback": "Detailed feedback explaining the scores and specific observations about the candidate's performance, strengths, and areas for improvement."
}}
 
Be specific and constructive in your feedback. Consider the interview type and duration when scoring."""
 
    def _parse_ai_evaluation_response(self, ai_response):
        """Parse the AI response and extract scores"""
        try:
            start_idx = ai_response.find('{')
            end_idx = ai_response.rfind('}') + 1
 
            if start_idx != -1 and end_idx > start_idx:
                json_str = ai_response[start_idx:end_idx]
                parsed = json.loads(json_str)
 
                required_fields = ['communication_score', 'technical_score', 'confidence_score', 'overall_score', 'feedback']
                for field in required_fields:
                    if field not in parsed:
                        raise ValueError(f"Missing required field: {field}")
 
                for score_field in ['communication_score', 'technical_score', 'confidence_score', 'overall_score']:
                    if score_field in parsed:
                        parsed[score_field] = max(0, min(10, float(parsed[score_field])))
 
                return parsed
            else:
                raise ValueError("No JSON found in AI response")
 
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            print(f"Failed to parse AI response: {e}")
            print(f"AI Response: {ai_response}")
            return self._get_fallback_scores()
 
    def _get_fallback_scores(self):
        """Return fallback scores if AI evaluation fails"""
        return {
            "communication_score": 5.0,
            "technical_score": 5.0,
            "confidence_score": 5.0,
            "overall_score": 5.0,
            "feedback": "AI evaluation temporarily unavailable. Basic analysis completed."
        }
 
    def _fallback_evaluation(self, transcript_data, duration_seconds):
        """Basic fallback evaluation if OpenAI fails"""
        user_messages = [msg for msg in transcript_data if msg['role'] == 'user']
 
        if not user_messages:
            return self._get_fallback_scores()
 
        avg_response_length = sum(len(msg['text'].split()) for msg in user_messages) / len(user_messages)
 
        communication_score = min(10, max(1, avg_response_length / 10))
        technical_score = 0.0
        confidence_score = min(10, max(1, len(user_messages) * 2))
 
        overall_score = (communication_score + technical_score + confidence_score) / 3
 
        return {
            "communication_score": round(communication_score, 1),
            "technical_score": round(technical_score, 1),
            "confidence_score": round(confidence_score, 1),
            "overall_score": round(overall_score, 1),
            "feedback": "Basic evaluation completed. AI analysis temporarily unavailable."
        }
 
    def _get_empty_analysis(self, duration_seconds):
        """Return empty analysis for interviews with no transcript"""
        return {
            "overall_score": 0.0,
            "communication_score": 0.0,
            "technical_score": 0.0,
            "confidence_score": 0.0,
            "word_count": 0,
            "sentence_count": 0,
            "response_count": 0,
            "feedback": "No transcript data available for analysis.",
            "transcript": []
        }