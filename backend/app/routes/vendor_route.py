from fastapi import APIRouter, Depends
from app.services.vendor_service import VendorService
from app.utils.auth_dependency import require_auth

router = APIRouter(tags=["Vendors"])

@router.post("/create-vendor")
async def create_vendor_route(
    vendor_name: str,
    vendor_email: str,
    vendor_contact: str,
    vendor_organization: str = None,
    current_user: dict = Depends(require_auth)
):

    vendor_id = await VendorService.create_vendor(
        vendor_name=vendor_name,
        vendor_email=vendor_email,
        vendor_contact=vendor_contact,
        vendor_organization=vendor_organization,
        created_by=current_user["admin_id"]
    )

    return {"message": "Vendor created successfully", "vendor_id": vendor_id}
