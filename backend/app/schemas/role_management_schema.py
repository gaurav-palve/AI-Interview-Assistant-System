from pydantic import BaseModel
from typing import List


class CreateRoleRequest(BaseModel):
    name: str
    description: str
    permissions: List[str] = []


class UpdateRoleRequest(BaseModel):
    name: str = None
    description: str = None
    is_active: bool = None
    permissions: List[str] = None

## permissions response models
class PermissionResponse(BaseModel):
    code: str
    module: str
    description: str
    
class GetPermissionsResponse(BaseModel):
    status: str
    permissions: List[PermissionResponse]