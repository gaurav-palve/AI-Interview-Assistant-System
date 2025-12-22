from fastapi import HTTPException


ALLOWED_DOMAIN = "aakanksha.bhavsar@neutrinotechlabs.com"

def validate_domain(email: str):
    if not email.lower().endswith(f"{ALLOWED_DOMAIN}"):
        raise HTTPException(status_code=400, detail="Signup allowed only for Super Admins")