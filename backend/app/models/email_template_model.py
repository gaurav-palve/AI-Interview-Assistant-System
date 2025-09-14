from datetime import datetime
from bson import ObjectId

EMAIL_TEMPLATE_COLLECTION = "email_templates"

def email_template_dict(
    name: str,
    subject: str,
    body: str,
    template_type: str,
    is_default: bool = False,
    created_by: str = None
):
    """
    Create a dictionary for an email template
    
    Args:
        name: Template name
        subject: Email subject line
        body: Email body content
        template_type: Type of template (confirmation, reminder, etc.)
        is_default: Whether this is the default template for its type
        created_by: Admin ID who created the template
    """
    return {
        "name": name,
        "subject": subject,
        "body": body,
        "template_type": template_type,
        "is_default": is_default,
        "created_by": created_by,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

def email_template_response(template):
    """Convert a template document to a response dictionary"""
    return {
        "id": str(template["_id"]),
        "name": template["name"],
        "subject": template["subject"],
        "body": template["body"],
        "template_type": template["template_type"],
        "is_default": template["is_default"],
        "created_by": template["created_by"],
        "created_at": template["created_at"].isoformat() if isinstance(template["created_at"], datetime) else template["created_at"],
        "updated_at": template["updated_at"].isoformat() if isinstance(template["updated_at"], datetime) else template["updated_at"]
    }