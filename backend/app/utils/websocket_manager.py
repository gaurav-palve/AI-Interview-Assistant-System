# backend/app/utils/websocket_manager.py
import asyncio
import json
from typing import Dict, Set, Optional
from fastapi import WebSocket

class WebSocketManager:
    def __init__(self):
        # map session_id -> set(WebSocket)
        self.connections: Dict[str, Set[WebSocket]] = {}
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        async with self.lock:
            if session_id not in self.connections:
                self.connections[session_id] = set()
            self.connections[session_id].add(websocket)

    async def disconnect(self, websocket: WebSocket):
        async with self.lock:
            # remove websocket from whichever session it belongs to
            for sid, conns in list(self.connections.items()):
                if websocket in conns:
                    conns.remove(websocket)
                    if not conns:
                        del self.connections[sid]
                    break

    async def broadcast(self, message: dict, session_id: Optional[str] = None):
        """Send message to all websockets for session_id.
           If session_id is None, broadcast to all sessions (use sparingly)."""
        data = json.dumps(message)
        async with self.lock:
            targets = []
            if session_id:
                targets = list(self.connections.get(session_id, []))
            else:
                # flatten all connections
                for conns in self.connections.values():
                    targets.extend(list(conns))

        for ws in targets:
            try:
                await ws.send_text(data)
            except Exception:
                # if send fails, remove connection
                await self.disconnect(ws)

# single instance to import
manager = WebSocketManager()

# The event loop used by run_coroutine_threadsafe; set it at app startup
_event_loop = None

def set_event_loop(loop):
    global _event_loop
    _event_loop = loop

def schedule_broadcast(message: dict, session_id: Optional[str] = None):
    """Call this from sync callbacks (e.g. ElevenLabs). It schedules the async broadcast safely."""
    if _event_loop:
        # schedule the coroutine to run in the running FastAPI event loop
        asyncio.run_coroutine_threadsafe(manager.broadcast(message, session_id=session_id), _event_loop)
    else:
        # fallback (not ideal) - tries to create a task in current loop
        try:
            asyncio.get_event_loop().create_task(manager.broadcast(message, session_id=session_id))
        except Exception:
            # best-effort failure: print/log
            print("No event loop available to schedule websocket broadcast")
