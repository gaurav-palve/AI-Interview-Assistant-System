# backend/app/llm_models/elevenlabs_agent.py
import os
import requests
from dotenv import load_dotenv
from app.utils.logger import logger
 
load_dotenv()
 
 
class ElevenLabsVoiceAgent:
    """
    Client-side WebRTC approach:
    The backend only generates signed URLs via the ElevenLabs REST API.
    The actual conversation (audio I/O) runs in the user's browser
    using the @elevenlabs/client JS SDK.
    """
 
    def __init__(self):
        self.agent_id = os.getenv("ELEVENLABS_AGENT_ID")
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        if not (self.agent_id and self.api_key):
            raise RuntimeError("Missing ELEVENLABS_AGENT_ID or ELEVENLABS_API_KEY in .env")
 
    def get_signed_url(self) -> str:
        """
        Call the ElevenLabs REST API to get a temporary signed URL.
        The frontend will use this URL to establish a WebRTC session
        directly with ElevenLabs — no server-side audio involved.
 
        Returns:
            str: The signed WebSocket URL for the frontend to connect to.
        """
        url = "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url"
        params = {"agent_id": self.agent_id}
        headers = {"xi-api-key": self.api_key}
 
        try:
            response = requests.get(url, params=params, headers=headers, timeout=15)
            response.raise_for_status()
            data = response.json()
            signed_url = data.get("signed_url")
            if not signed_url:
                raise RuntimeError("ElevenLabs API returned no signed_url")
            logger.info("Successfully obtained ElevenLabs signed URL")
            return signed_url
        except requests.RequestException as e:
            logger.error(f"Failed to get signed URL from ElevenLabs: {e}")
            raise RuntimeError(f"Failed to get signed URL: {e}")
 