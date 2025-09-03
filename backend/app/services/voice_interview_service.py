import uuid
import json
from datetime import datetime, timezone
from app.llm_models.elevenlabs_agent import ElevenLabsVoiceAgent
from app.llm_models.openai_llm import OpenAILLM
from app.models.voice_interview_model import voice_interview_session_dict, update_voice_session_dict
from app.database import create_voice_session, update_voice_session, get_voice_session, create_voice_session_with_id

class VoiceInterviewService:
    _shared_agent = None  # ← Singleton instance
    _transcripts = {}  # Store transcripts by session_id

    @classmethod
    def get_shared_agent(cls):
        """Get the shared ElevenLabs agent instance (singleton pattern)"""
        if cls._shared_agent is None:
            cls._shared_agent = ElevenLabsVoiceAgent()
        return cls._shared_agent

    @classmethod
    def add_transcript(cls, session_id, role, text):
        """Add transcript message to session"""
        if session_id not in cls._transcripts:
            cls._transcripts[session_id] = []
        cls._transcripts[session_id].append({
            'role': role,
            'text': text,
            'timestamp': datetime.now(timezone.utc)
        })

    @classmethod
    def get_transcript(cls, session_id):
        """Get full transcript for session"""
        return cls._transcripts.get(session_id, [])

    def __init__(self):
        # Use shared agent instead of creating new one
        self.agent = self.get_shared_agent()

    async def start_voice_interview(self, interview_id, candidate_id):
        """
        Start a voice interview session.
        Business logic: generate session_id, start ElevenLabs session, save to DB
        """
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        print(f"Generated session_id: {session_id}")

        try:
            # Start ElevenLabs conversation first
            print("Starting ElevenLabs session...")
            result = self.agent.start_session(session_id=session_id)
            print(f"ElevenLabs session started successfully: {result}")

            # Save to database with the same session_id
            saved_session = await create_voice_session_with_id(interview_id, candidate_id, session_id)
            print(f"Voice interview session created and saved: {session_id}")

            # Add websocket_url and return
            saved_session["websocket_url"] = result["websocket_path"]
            saved_session["status"] = "active"
            return saved_session

        except Exception as e:
            print(f"Error starting voice interview with session_id {session_id}: {str(e)}")
            print("This error will be caught by the route handler and detailed logs will be printed there")
            raise

    def stop_voice_interview_legacy(self, session_id):
        """
        Stop voice interview (legacy endpoint).
        Business logic: end ElevenLabs session, update DB
        """
        # End ElevenLabs conversation
        self.agent.end_session()

        # TODO: Update database record
        # db.voice_sessions.update_one(
        #     {"session_id": session_id},
        #     {"$set": {
        #         "status": "completed",
        #         "completed_at": datetime.now(timezone.utc)
        #     }}
        # )

        return {
            "message": "Voice interview stopped successfully",
            "session_id": session_id
        }

    async def complete_voice_interview(self, session_id, duration_seconds):
        """
        Complete voice interview session.
        Business logic: end ElevenLabs session, analyze transcript, calculate scores, save to DB
        """
        # End ElevenLabs conversation
        self.agent.end_session()

        # Get transcript for analysis
        transcript_data = self.get_transcript(session_id)

        # Analyze transcript and calculate scores
        analysis = self._analyze_interview_transcript(transcript_data, duration_seconds)

        # Prepare update data for database
        update_data = {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc),
            "duration_seconds": duration_seconds,
            "transcript": transcript_data,
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
            # Continue with response even if DB save fails

        # Create completion response with full results
        completed_session = {
            "session_id": session_id,
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "duration_seconds": duration_seconds,
            "message": "Voice interview completed successfully",
            # Add analysis results
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
            "sentence_count": max(1, sentence_count),  # Avoid division by zero
            "response_count": response_count,
            "feedback": ai_evaluation.get("feedback", "Analysis completed."),
            "transcript": transcript_data
        }

    def _evaluate_with_openai(self, transcript_data, duration_seconds):
        """
        Use OpenAI to intelligently evaluate the interview transcript
        """
        try:
            # Initialize OpenAI LLM
            openai_llm = OpenAILLM()

            # Format transcript for AI evaluation
            formatted_transcript = self._format_transcript_for_ai(transcript_data)

            # Create evaluation prompt
            evaluation_prompt = self._create_evaluation_prompt(formatted_transcript, duration_seconds)

            # Get AI evaluation
            ai_response = openai_llm.generate_response(evaluation_prompt)

            # Parse AI response
            return self._parse_ai_evaluation_response(ai_response)

        except Exception as e:
            print(f"OpenAI evaluation failed: {e}")
            # Fallback to basic analysis if AI fails
            return self._fallback_evaluation(transcript_data, duration_seconds)

    def _format_transcript_for_ai(self, transcript_data):
        """Format transcript data for AI evaluation"""
        formatted_lines = []
        for msg in transcript_data:
            role = "Interviewer" if msg['role'] == 'agent' else "Candidate"
            timestamp = msg['timestamp'].strftime("%H:%M:%S")
            text = msg['text']
            formatted_lines.append(f"[{timestamp}] {role}: {text}")

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
            # Try to extract JSON from the response
            # Look for JSON block in the response
            start_idx = ai_response.find('{')
            end_idx = ai_response.rfind('}') + 1

            if start_idx != -1 and end_idx > start_idx:
                json_str = ai_response[start_idx:end_idx]
                parsed = json.loads(json_str)

                # Validate required fields
                required_fields = ['communication_score', 'technical_score', 'confidence_score', 'overall_score', 'feedback']
                for field in required_fields:
                    if field not in parsed:
                        raise ValueError(f"Missing required field: {field}")

                # Ensure scores are within 0-10 range
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

        # Simple fallback scoring
        avg_response_length = sum(len(msg['text'].split()) for msg in user_messages) / len(user_messages)

        communication_score = min(10, max(1, avg_response_length / 10))
        technical_score = 0.0  # Default to 0 for non-technical content
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

    def stop_voice_interview(self, session_data):
        """
        Legacy method for stopping voice interview with session data object.
        """
        convo = self.agent.wait_until_end()
        updates = {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc),
            "conversation_id": convo.get("conversation_id")
        }
        return update_voice_session_dict(session_data, updates)
