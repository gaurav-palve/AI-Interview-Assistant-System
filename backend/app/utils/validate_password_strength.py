import re
from fastapi import HTTPException

def validate_password_strength(password: str) -> bool:
    """
    Validate password strength with specific error messages.
    Raises HTTPException with detailed reason if invalid.
    Returns True if password passes all checks.
    """

    # Check length
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    # Check uppercase
    if not re.search(r'[A-Z]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter (A-Z).")

    # Check lowercase
    if not re.search(r'[a-z]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter (a-z).")

    # Check digit
    if not re.search(r'\d', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one digit (0-9).")

    # Check special character
    if not re.search(r'[^A-Za-z0-9]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character (e.g., @, #, $, %, &).")

    return True
