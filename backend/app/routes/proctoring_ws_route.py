import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..utils.websocket_manager import manager
from ..utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["Proctoring"])


@router.websocket("/proctoring/{session_id}")
async def proctoring_ws(websocket: WebSocket, session_id: str):
    # MUST accept here (NOT inside manager)
    await websocket.accept()
    await manager.connect(websocket, session_id)

    logger.info(f" Proctoring WS connected: {session_id}")

    try:
        while True:
            msg = await websocket.receive_text()

            try:
                event = json.loads(msg)
            except Exception:
                event = {"raw": msg}

            logger.info(f" Proctor event: {event}")

            await manager.broadcast(
                {"type": "PROCTOR_EVENT", "session_id": session_id, "event": event},
                session_id=session_id,
            )

    except WebSocketDisconnect:
        logger.warning(f" Proctoring WS disconnected: {session_id}")
        await manager.disconnect(websocket)

    except Exception as e:
        logger.exception(f" Proctoring WS error: {str(e)}")
        await manager.disconnect(websocket)
