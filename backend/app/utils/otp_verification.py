from datetime import datetime
from fastapi import HTTPException

async def verify_otp(db, email: str, otp: int, otp_collection: str):
    """
    Verifies the OTP for a given email.
    
    Args:
        db: MongoDB database instance
        email (str): User email
        otp (int): OTP entered by the user
        otp_collection (str): MongoDB OTP collection name
        
    Returns:
        dict: The OTP record if verification is successful
    """

    # 1. Fetch OTP record
    record = await db[otp_collection].find_one({"email": email})
    if not record:
        raise HTTPException(status_code=400, detail="OTP not found")

    # 2. Check if OTP matches
    if record["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # 3. Check expiry
    if datetime.utcnow() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP expired")

    # If everything is correct, return record
    return True
