import asyncio
import json
from typing import Dict, Optional
from fastapi import WebSocket


class WebSocketManager:
    def __init__(self):
        # session_id -> { ws_id: websocket }
        self.connections: Dict[str, Dict[int, WebSocket]] = {}
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, session_id: str):
        """
        IMPORTANT:
        websocket.accept() MUST be called in the websocket route itself.
        """
        async with self.lock:
            self.connections.setdefault(session_id, {})[id(websocket)] = websocket

    async def disconnect(self, websocket: WebSocket):
        async with self.lock:
            for sid in list(self.connections.keys()):
                if id(websocket) in self.connections[sid]:
                    del self.connections[sid][id(websocket)]
                    if not self.connections[sid]:
                        del self.connections[sid]
                    break

    async def broadcast(self, message: dict, session_id: Optional[str] = None):
        data = json.dumps(message)

        async with self.lock:
            if session_id:
                targets = list(self.connections.get(session_id, {}).values())
            else:
                targets = []
                for conns in self.connections.values():
                    targets.extend(conns.values())

        for ws in targets:
            try:
                await ws.send_text(data)
            except Exception:
                await self.disconnect(ws)


# single instance
manager = WebSocketManager()

_event_loop = None


def set_event_loop(loop):
    global _event_loop
    _event_loop = loop


def schedule_broadcast(message: dict, session_id: Optional[str] = None):
    if _event_loop:
        asyncio.run_coroutine_threadsafe(
            manager.broadcast(message, session_id=session_id), _event_loop
        )
    else:
        try:
            asyncio.get_event_loop().create_task(
                manager.broadcast(message, session_id=session_id)
            )
        except Exception:
            print("No event loop available to schedule websocket broadcast")
