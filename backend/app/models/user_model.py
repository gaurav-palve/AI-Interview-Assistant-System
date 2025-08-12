from typing import Optional
from datetime import datetime, timezone

def admin_dict(email: str, hashed_password: str):
    return {
        "email": email,
        "hashed_password": hashed_password,
        "role": "admin",
        "created_at": datetime.now(timezone.utc)
    }
