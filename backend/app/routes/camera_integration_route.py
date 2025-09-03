from fastapi import APIRouter, HTTPException, Query
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from ..services.camera_service import gen_frames, start_camera, stop_camera
from ..utils.logger import get_logger
from pydantic import BaseModel
from typing import Optional

logger = get_logger(__name__)
router = APIRouter(prefix="/camera", tags=["Camera"])

class CameraConfig(BaseModel):
    width: Optional[int] = 640
    height: Optional[int] = 480

@router.get("/camera-integration")
def camera_integration():
    """
    Stream camera feed with proctoring capabilities
    """
    try:
        return StreamingResponse(gen_frames(), media_type="multipart/x-mixed-replace; boundary=frame")
    except Exception as e:
        logger.error(f"Error in camera_integration: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error streaming camera feed: {str(e)}")

@router.post("/start")
def start_camera_endpoint(config: CameraConfig):
    """
    Start the camera with specified resolution
    """
    try:
        result = start_camera(config.width, config.height)
        if result:
            return {"status": "success", "message": f"Camera started with resolution {config.width}x{config.height}"}
        else:
            return {"status": "warning", "message": "Camera was already running"}
    except Exception as e:
        logger.error(f"Error starting camera: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error starting camera: {str(e)}")

@router.post("/stop")
def stop_camera_endpoint():
    """
    Stop the camera
    """
    try:
        result = stop_camera()
        if result:
            return {"status": "success", "message": "Camera stopped"}
        else:
            return {"status": "warning", "message": "Camera was not running"}
    except Exception as e:
        logger.error(f"Error stopping camera: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error stopping camera: {str(e)}")

@router.get("/status")
def camera_status():
    """
    Get camera status and cheating statistics
    """
    from ..services.camera_service import camera_active, hand_cheating_counter, face_cheating_counter, iris_cheating_counter, phone_cheating_counter
    
    return {
        "active": camera_active,
        "statistics": {
            "hand_on_face_detections": hand_cheating_counter,
            "face_missing_detections": face_cheating_counter,
            "looking_away_detections": iris_cheating_counter,
            "phone_detections": phone_cheating_counter
        }
    }