from fastapi import HTTPException
from app.database import create_vendor
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class VendorService:

    async def create_vendor(
        vendor_name: str,
        vendor_email: str,
        vendor_contact: str,
        created_by: str,
        vendor_organization: str = None):
        try:
            vendor_data = {
            "vendor_name": vendor_name,
            "vendor_email": vendor_email,
            "vendor_contact": vendor_contact,
            "vendor_organization": vendor_organization,
            "created_by": created_by,
            "created_at": datetime.now(timezone.utc)
        }
            vendor_id = await create_vendor(vendor_data)
            return vendor_id
        
        except Exception as e:
            logger.error(f"Error creating vendor: {e}")
            raise HTTPException(status_code=500, detail="Failed to create vendor")
