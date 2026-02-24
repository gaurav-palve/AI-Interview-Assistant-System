from pydantic import BaseModel
from typing import Optional

class CameraConfig(BaseModel):
    width: Optional[int] = 640
    height: Optional[int] = 480
    enable_detection: Optional[bool] = False
