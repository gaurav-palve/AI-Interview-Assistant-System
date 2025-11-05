from fastapi import APIRouter, HTTPException, Query, Body
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from ..services.camera_service import gen_frames, start_camera, stop_camera, set_detection_enabled
from ..utils.logger import get_logger
from pydantic import BaseModel
from typing import Optional

logger = get_logger(__name__)
router = APIRouter(tags=["Camera"])

class CameraConfig(BaseModel):
    width: Optional[int] = 640
    height: Optional[int] = 480
    enable_detection: Optional[bool] = False

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
    Start the camera with specified resolution and detection setting
    """
    try:
        result = start_camera(config.width, config.height, config.enable_detection)
        detection_status = "enabled" if config.enable_detection else "disabled"
        if result:
            return {"status": "success", "message": f"Camera started with resolution {config.width}x{config.height}, detection {detection_status}"}
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
@router.post("/toggle_detection")
def toggle_detection(enable: bool = Body(..., embed=True)):
    """
    Enable or disable cheating detection
    """
    try:
        # Use the function to set the detection flag
        detection_enabled = set_detection_enabled(enable)
        
        status = "enabled" if enable else "disabled"
        return {"status": "success", "message": f"Cheating detection {status}", "detection_enabled": detection_enabled}
    except Exception as e:
        logger.error(f"Error toggling detection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error toggling detection: {str(e)}")

@router.get("/status")
def camera_status():
    """
    Get camera status and cheating statistics
    """
    from ..services.camera_service import camera_active, detection_enabled, face_missing_counter, multiple_faces_counter, iris_cheating_counter, phone_cheating_counter
    
    return {
        "active": camera_active,
        "detection_enabled": detection_enabled,
        "statistics": {
            "face_missing_detections": face_missing_counter,
            "multiple_faces_detections": multiple_faces_counter,
            "looking_away_detections": iris_cheating_counter,
            "phone_detections": phone_cheating_counter
        }
    }