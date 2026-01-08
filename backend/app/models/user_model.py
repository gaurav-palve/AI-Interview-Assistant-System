from typing import Optional
from datetime import datetime, timezone

def admin_dict(
    first_name,
    middle_name,
    last_name,
    mobile_number,
    email, 
    hashed_pw,
    role_id: Optional[str] = None
):
    
    return {
        "first_name": first_name,
        "middle_name": middle_name,
        "last_name": last_name,
        "mobile_number": mobile_number,
        "email": email,
        "hashed_password": hashed_pw,
        "role_id": role_id,
        "created_at": datetime.now(timezone.utc),
        "is_active": True
    }
