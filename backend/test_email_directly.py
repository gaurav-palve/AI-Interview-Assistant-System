import asyncio
import os
import sys
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("email_test")

async def test_email():
    # Get email settings from environment variables or use defaults
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME", "gauravpalve28@gmail.com")
    smtp_password = os.getenv("SMTP_PASSWORD", "smgz lnpw npuj jzxo")  # App Password
    from_email = os.getenv("FROM_EMAIL", "gauravpalve28@gmail.com")
    
    # Get test recipient email from command line argument or use default
    to_email ='manishjangid15776@gmail.com'
    
    logger.info(f"Testing email with the following configuration:")
    logger.info(f"SMTP Server: {smtp_server}")
    logger.info(f"SMTP Port: {smtp_port}")
    logger.info(f"SMTP Username: {smtp_username}")
    logger.info(f"SMTP Password: {'*' * len(smtp_password) if smtp_password else 'Not set'}")
    logger.info(f"From Email: {from_email}")
    logger.info(f"To Email: {to_email}")
    
    # Create message
    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = "Test Email from AI Interview Assistant"
    
    # Email body
    body = """
This is a test email from the AI Interview Assistant application.

If you're receiving this email, it means the SMTP configuration is working correctly.

Best regards,
AI Interview Assistant Team
    """
    
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        # Create SMTP connection with extended timeout
        logger.info("Creating SMTP connection...")
        server = smtplib.SMTP(smtp_server, smtp_port, timeout=30)
        
        # Enable debug output
        server.set_debuglevel(2)  # More verbose debug output
        logger.info("SMTP connection established")
        
        # Get server info
        try:
            server_info = server.ehlo()
            logger.info(f"Server info: {server_info}")
        except Exception as e:
            logger.error(f"Error getting server info: {e}")
        
        # Start TLS
        logger.info("Starting TLS...")
        server.starttls()
        logger.info("STARTTLS initiated")
        
        # Re-identify to server after TLS
        try:
            server_info_tls = server.ehlo()
            logger.info(f"Server info after TLS: {server_info_tls}")
        except Exception as e:
            logger.error(f"Error getting server info after TLS: {e}")
        
        # Login
        logger.info(f"Attempting login with username: {smtp_username}")
        server.login(smtp_username, smtp_password)
        logger.info("SMTP login successful")
        
        # Send email
        text = msg.as_string()
        logger.info(f"Sending email from {from_email} to {to_email}")
        server.sendmail(from_email, to_email, text)
        logger.info(f"Email sent successfully")
        
        # Close connection
        server.quit()
        logger.info("SMTP connection closed")
        
        return True
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication Error: {e}")
        logger.error("This usually means your username or password is incorrect, or you need to enable 'Less secure app access' in your email settings.")
        logger.error("For Outlook/Microsoft accounts, you may need to create an 'App Password' if you have 2FA enabled.")
        return False
    except smtplib.SMTPException as e:
        logger.error(f"SMTP Error: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False

if __name__ == "__main__":
    logger.info("Starting direct email test...")
    result = asyncio.run(test_email())
    if result:
        logger.info("Email test completed successfully!")
    else:
        logger.error("Email test failed!")