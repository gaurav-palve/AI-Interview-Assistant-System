import base64
import time
import logging
from ..config import settings

logger = logging.getLogger(__name__)

# Try to import msal, but provide fallback if not available
try:
    import msal
    MSAL_AVAILABLE = True
    logger.info("MSAL module successfully imported")
except ImportError:
    MSAL_AVAILABLE = False
    logger.warning("MSAL module not found. OAuth2 authentication will not be available.")
    logger.warning("To use OAuth2, install the msal package with: pip install msal")

def get_access_token():
    """
    Get an OAuth2 access token for Microsoft Graph API using MSAL
    """
    if not MSAL_AVAILABLE:
        logger.error("Cannot get access token: MSAL module not available")
        logger.error("Install the msal package with: pip install msal")
        return None
        
    try:
        # Initialize the MSAL app
        app = msal.ConfidentialClientApplication(
            client_id=settings.MS_CLIENT_ID,
            client_credential=settings.MS_CLIENT_SECRET,
            authority=f"https://login.microsoftonline.com/{settings.MS_TENANT_ID}"
        )
        
        # Acquire token for the SMTP.Send scope
        result = app.acquire_token_for_client(scopes=[settings.MS_SCOPE])
        
        if "access_token" in result:
            logger.info("Successfully acquired OAuth2 token")
            return result["access_token"]
        else:
            logger.error(f"Failed to acquire token: {result.get('error')}")
            logger.error(f"Error description: {result.get('error_description')}")
            return None
    except Exception as e:
        logger.error(f"Error getting OAuth2 token: {e}")
        return None

def generate_oauth2_string(username, access_token):
    """
    Generate the XOAUTH2 string for SMTP authentication
    """
    auth_string = f"user={username}\x01auth=Bearer {access_token}\x01\x01"
    return base64.b64encode(auth_string.encode()).decode()