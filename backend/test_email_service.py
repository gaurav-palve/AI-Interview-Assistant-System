import asyncio
import sys
import logging
from app.services.email_service import EmailService
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("email_service_test")

async def test_email_service():
    # Get test recipient email from command line argument or use default
    to_email = sys.argv[1] if len(sys.argv) > 1 else "manishjangid15776@gmail.com"
    
    logger.info(f"Testing EmailService with Gmail App Password configuration:")
    logger.info(f"SMTP Server: {settings.SMTP_SERVER} (Gmail)")
    logger.info(f"SMTP Port: {settings.SMTP_PORT}")
    logger.info(f"SMTP Username: {settings.SMTP_USERNAME}")
    logger.info(f"SMTP Password: {'*' * len(settings.SMTP_PASSWORD) if settings.SMTP_PASSWORD else 'Not set'}")
    logger.info(f"From Email: {settings.FROM_EMAIL}")
    logger.info(f"To Email: {to_email}")
    
    try:
        # Create EmailService instance
        email_service = EmailService()
        
        # Send test email
        logger.info("Sending test email using EmailService...")
        result = await email_service.send_interview_confirmation(
            candidate_email=to_email,
            candidate_name="Test User",
            job_role="Test Position",
            scheduled_datetime="2025-08-15 10:00 AM",
            interview_id="TEST-123"
        )
        
        if result:
            logger.info("Email sent successfully using EmailService!")
            return True
        else:
            logger.error("EmailService failed to send email!")
            return False
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False

if __name__ == "__main__":
    logger.info("Starting EmailService test...")
    result = asyncio.run(test_email_service())
    if result:
        logger.info("EmailService test completed successfully!")
    else:
        logger.error("EmailService test failed!")