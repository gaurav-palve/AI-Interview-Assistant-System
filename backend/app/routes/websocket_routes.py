# backend/app/routes/websocket_routes.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.utils.websocket_manager import manager

router = APIRouter()

@router.websocket("/voice/{session_id}")
async def ws_voice_endpoint(websocket: WebSocket, session_id: str):
    """
    Frontend connects here: /ws/voice/{session_id}
    Example: ws://localhost:8000/ws/voice/<session_id>
    """
    await manager.connect(websocket, session_id)
    try:
        while True:
            # Keep the socket open and optionally read incoming messages
            data = await websocket.receive_text()
            # If frontend sends text messages, you can parse and handle them here.
            # Example: forward text messages to the agent or persist them.
            # For now we simply ignore or log.
            # print("Received from frontend:", data)
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        await manager.disconnect(websocket)
