# backend/app/llm_models/elevenlabs_agent.py
import os
import threading
from dotenv import load_dotenv
from elevenlabs import ElevenLabs
from elevenlabs.conversational_ai.conversation import Conversation
from elevenlabs.conversational_ai.default_audio_interface import DefaultAudioInterface
from app.utils.websocket_manager import schedule_broadcast
from app.utils.logger import logger  # optional; use print if no logger

load_dotenv()

class ElevenLabsVoiceAgent:
    def __init__(self):
        self.agent_id = os.getenv("ELEVENLABS_AGENT_ID")
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        if not (self.agent_id and self.api_key):
            raise RuntimeError("Missing ELEVENLABS_AGENT_ID or ELEVENLABS_API_KEY in .env")
        self.client = ElevenLabs(api_key=self.api_key)
        self.current_session_id = None
        self.conversation = None
        self._thread = None

    def _make_callbacks(self, session_id: str):
        # helper to return callbacks wired to session_id
        def cb_agent_response(text):
            # called when agent replies; send transcript_update to matching session
            message = {"type": "transcript_update", "role": "agent", "text": text}
            schedule_broadcast(message, session_id=session_id)
            # Also save to service for results
            from app.services.voice_interview_service import VoiceInterviewService
            VoiceInterviewService.add_transcript(session_id, "agent", text)

        def cb_user_transcript(text):
            # called when user speech is transcribed
            message = {"type": "transcript_update", "role": "user", "text": text}
            schedule_broadcast(message, session_id=session_id)
            # Also save to service for results
            from app.services.voice_interview_service import VoiceInterviewService
            VoiceInterviewService.add_transcript(session_id, "user", text)

        # Optional: connection lifecycle messages
        def cb_session_start():
            schedule_broadcast({"type": "connection_status", "status": "connected"}, session_id=session_id)

        def cb_session_end():
            schedule_broadcast({"type": "connection_status", "status": "disconnected"}, session_id=session_id)

        return cb_agent_response, cb_user_transcript, cb_session_start, cb_session_end

    def start_session(self, session_id: str):
        """Start a new ElevenLabs conversation session in a background thread."""
        self.current_session_id = session_id

        agent_cb, user_cb, start_cb, end_cb = self._make_callbacks(session_id)

        # create a Conversation object per session so callbacks can be unique
        conv = Conversation(
            self.client,
            self.agent_id,
            requires_auth=True,
            audio_interface=DefaultAudioInterface(),
            callback_agent_response=agent_cb,
            callback_user_transcript=user_cb,
            # you can also provide latency or correction callbacks if available
        )

        self.conversation = conv

        def run_conv():
            try:
                # notify client that backend is starting the conversation
                start_cb()
                conv.start_session()  # blocking call that runs the conversation
            except Exception as e:
                logger.exception("ElevenLabs session error") if 'logger' in globals() else print("ElevenLabs error:", e)
            finally:
                # ensure we notify clients when session ends
                end_cb()

        # run conversation in background thread (so HTTP endpoints are not blocked)
        t = threading.Thread(target=run_conv, daemon=True)
        t.start()
        self._thread = t

        # return info immediately (frontend needs websocket_url)
        return {
            "session_id": session_id,
            "websocket_path": f"/ws/voice/{session_id}"
        }

    def end_session(self):
        """Ask the current conversation to end (if available)."""
        if self.conversation:
            try:
                self.conversation.end_session()
            except Exception:
                pass

    def wait_for_session_end(self):
        if self._thread:
            self._thread.join()
            # conversation probably ended — ElevenLabs may return conversation id
            # if their Conversation object offers that, extract it and broadcast to DB
