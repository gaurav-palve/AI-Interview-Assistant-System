import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.message import EmailMessage
from email.mime.base import MIMEBase
from email import encoders
import os
from typing import Optional
import logging
from ..config import settings
import imghdr 


# Try to import OAuth2 functions, but provide fallback if not available
try:
    from ..utils.ms_oauth import get_access_token, generate_oauth2_string, MSAL_AVAILABLE
except ImportError:
    # If ms_oauth.py couldn't be imported at all
    MSAL_AVAILABLE = False
    get_access_token = None
    generate_oauth2_string = None
    logging.warning("OAuth2 functionality not available. Using password authentication only.")

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = int(settings.SMTP_PORT)
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL
        self.frontend_url = settings.FRONTEND_URL
        
    async def send_interview_confirmation(
        self, 
        candidate_email: str, 
        candidate_name: str, 
        job_role: str, 
        scheduled_datetime: str,
        interview_id: str
    ) -> bool:
        """Send interview confirmation email to candidate"""
        try:
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured. Skipping email send.")
                return False
            
            # Create candidate interview URL
            # Create candidate interview URL - this should match the route in the frontend
            interview_url = f"{self.frontend_url}/candidate/interview/{interview_id}"
            
            # Create message
            msg = EmailMessage()
            msg['From'] = self.from_email
            msg['To'] = candidate_email
            msg['Subject'] = f"Interview Confirmation - {job_role} Position"
            
            # Email body
            body = f"""
Dear {candidate_name},

Your interview for the {job_role} position has been successfully scheduled.

Interview Details:
- Position: {job_role}
- Date & Time: {scheduled_datetime}
- Interview ID: {interview_id}
- Interview Link: {interview_url}

Please click on the interview link at the scheduled time. You will see instructions and a start button.
When you're ready, click the start button to begin the interview.

If you need to reschedule or have any questions, please contact us immediately.

Best regards,
Interview System Team
            """
            
            msg.set_content(body)
            
            # Try to attach image if it exists
            try:
                attachment_path = r"C:\Users\gaurav.palve\Downloads\shared image.png"
                if os.path.exists(attachment_path):
                    with open(attachment_path, 'rb') as f:
                        file_data = f.read()
                        file_name = os.path.basename(f.name)
                        file_type = imghdr.what(f.name)
                        
                        if file_type not in ['jpeg', 'png']:
                            logger.warning(f"Attachment type '{file_type}' not supported. Only JPG/JPEG images allowed.")
                        else:
                            msg.add_attachment(
                                file_data,
                                maintype='image',
                                subtype=file_type,
                                filename=file_name
                            )
                            logger.info(f"Added image attachment: {file_name}")
                else:
                    logger.warning(f"Image attachment not found at {attachment_path}, skipping")
            except Exception as e:
                logger.warning(f"Error attaching image: {e}, continuing without image attachment")
            
            # Try to attach PDF if it exists
            try:
                pdf_path = r"C:\Users\gaurav.palve\Downloads\Python-Fresher-JD.pdf"
                if os.path.exists(pdf_path):
                    with open(pdf_path, 'rb') as f:
                        file_data = f.read()
                        file_name = os.path.basename(f.name)
                    msg.add_attachment(
                        file_data,
                        maintype='application',
                        subtype='pdf',
                        filename=file_name
                    )
                    logger.info(f"Added PDF attachment: {file_name}")
                else:
                    logger.warning(f"PDF attachment not found at {pdf_path}, skipping")
            except Exception as e:
                logger.warning(f"Error attaching PDF: {e}, continuing without PDF attachment")

                        

            # Connect to SMTP server and send email
            logger.info(f"Connecting to SMTP server: {self.smtp_server}:{self.smtp_port}")
            logger.info(f"Using SMTP username: {self.smtp_username}")
            logger.info(f"From email: {self.from_email}")
            
            try:
                # Print all email configuration for debugging
                logger.info("=== EMAIL CONFIGURATION DEBUG ===")
                logger.info(f"SMTP Server: {self.smtp_server}")
                logger.info(f"SMTP Port: {self.smtp_port}")
                logger.info(f"SMTP Username: {self.smtp_username}")
                logger.info(f"Using OAuth2: {settings.USE_OAUTH2}")
                logger.info(f"From Email: {self.from_email}")
                logger.info(f"To Email: {candidate_email}")
                logger.info(f"Email Subject: {msg['Subject']}")
                logger.info("Email Body Preview: " + body[:100] + "...")
                logger.info("=== END EMAIL CONFIGURATION DEBUG ===")
                
                # Create SMTP connection with extended timeout
                logger.info("Creating SMTP connection...")
                server = smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=30)
                
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
                
                # Login - using OAuth2 or password based on settings
                if settings.USE_OAUTH2 and MSAL_AVAILABLE:
                    logger.info("Using OAuth2 authentication")
                    access_token = get_access_token()
                    if not access_token:
                        logger.error("Failed to get OAuth2 access token")
                        logger.info("Falling back to password authentication")
                        server.login(self.smtp_username, self.smtp_password)
                        logger.info("Password authentication successful (fallback)")
                    else:
                        auth_string = generate_oauth2_string(self.smtp_username, access_token)
                        server.auth("XOAUTH2", lambda x: auth_string)
                        logger.info("OAuth2 authentication successful")
                else:
                    if settings.USE_OAUTH2 and not MSAL_AVAILABLE:
                        logger.warning("OAuth2 requested but MSAL module not available. Falling back to password authentication.")
                        logger.warning("To use OAuth2, install the msal package with: pip install msal")
                    
                    logger.info(f"Using password authentication with username: {self.smtp_username}")
                    server.login(self.smtp_username, self.smtp_password)
                    logger.info("Password authentication successful")
                
                # Send email
                server.send_message(msg)
                logger.info(f"Email sent successfully")
                
                # Close connection
                server.quit()
                logger.info("SMTP connection closed")
            except smtplib.SMTPAuthenticationError as e:
                logger.error(f"SMTP Authentication Error: {e}")
                raise
            except smtplib.SMTPException as e:
                logger.error(f"SMTP Error: {e}")
                raise
            
            logger.info(f"Interview confirmation email sent to {candidate_email}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending email to {candidate_email}: {e}")
            return False
            

    async def send_custom_confirmation_email(
        self, 
        candidate_email: str, 
        candidate_name: str, 
        job_role: str, 
        scheduled_datetime: str,
        interview_id: str,
        custom_body: str,
        attachments: list = None
    ) -> bool:
        """Send custom interview confirmation email to candidate"""
        try:
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured. Skipping email send.")
                return False
            
            # Create candidate interview URL
            interview_url = f"{self.frontend_url}/candidate/interview/{interview_id}"
            
            # Create message
            msg = EmailMessage()
            msg['From'] = self.from_email
            msg['To'] = candidate_email
            msg['Subject'] = f"Interview Confirmation - {job_role} Position"
            
            # Use the custom email body
            msg.set_content(custom_body)
            
            # Add attachments if provided
            if attachments and len(attachments) > 0:
                for attachment in attachments:
                    file_data = attachment.get('data')
                    file_name = attachment.get('filename')
                    file_type = attachment.get('content_type')
                    
                    if not file_data or not file_name:
                        logger.warning(f"Skipping attachment with missing data or filename")
                        continue
                    
                    # Determine maintype and subtype based on content_type
                    maintype, subtype = file_type.split('/', 1) if '/' in file_type else ('application', 'octet-stream')
                    
                    # Add the attachment to the email
                    msg.add_attachment(
                        file_data,
                        maintype=maintype,
                        subtype=subtype,
                        filename=file_name
                    )
                    logger.info(f"Added attachment: {file_name} ({file_type})")
            
            # Connect to SMTP server and send email
            logger.info(f"Connecting to SMTP server: {self.smtp_server}:{self.smtp_port}")
            logger.info(f"Using SMTP username: {self.smtp_username}")
            logger.info(f"From email: {self.from_email}")
            
            try:
                # Print all email configuration for debugging
                logger.info("=== EMAIL CONFIGURATION DEBUG ===")
                logger.info(f"SMTP Server: {self.smtp_server}")
                logger.info(f"SMTP Port: {self.smtp_port}")
                logger.info(f"SMTP Username: {self.smtp_username}")
                logger.info(f"Using OAuth2: {settings.USE_OAUTH2}")
                logger.info(f"From Email: {self.from_email}")
                logger.info(f"To Email: {candidate_email}")
                logger.info(f"Email Subject: {msg['Subject']}")
                logger.info("Email Body Preview: " + custom_body[:100] + "...")
                logger.info("=== END EMAIL CONFIGURATION DEBUG ===")
                
                # Create SMTP connection with extended timeout
                logger.info("Creating SMTP connection...")
                server = smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=30)
                
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
                
                # Login - using OAuth2 or password based on settings
                if settings.USE_OAUTH2 and MSAL_AVAILABLE:
                    logger.info("Using OAuth2 authentication")
                    access_token = get_access_token()
                    if not access_token:
                        logger.error("Failed to get OAuth2 access token")
                        logger.info("Falling back to password authentication")
                        server.login(self.smtp_username, self.smtp_password)
                        logger.info("Password authentication successful (fallback)")
                    else:
                        auth_string = generate_oauth2_string(self.smtp_username, access_token)
                        server.auth("XOAUTH2", lambda x: auth_string)
                        logger.info("OAuth2 authentication successful")
                else:
                    if settings.USE_OAUTH2 and not MSAL_AVAILABLE:
                        logger.warning("OAuth2 requested but MSAL module not available. Falling back to password authentication.")
                        logger.warning("To use OAuth2, install the msal package with: pip install msal")
                    
                    logger.info(f"Using password authentication with username: {self.smtp_username}")
                    server.login(self.smtp_username, self.smtp_password)
                    logger.info("Password authentication successful")
                
                # Send email
                server.send_message(msg)
                logger.info(f"Email sent successfully")
                
                # Close connection
                server.quit()
                logger.info("SMTP connection closed")
            except smtplib.SMTPAuthenticationError as e:
                logger.error(f"SMTP Authentication Error: {e}")
                raise
            except smtplib.SMTPException as e:
                logger.error(f"SMTP Error: {e}")
                raise
            
            logger.info(f"Custom interview confirmation email sent to {candidate_email}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending custom email to {candidate_email}: {e}")
            return False
    
    async def send_interview_reminder(
        self, 
        candidate_email: str, 
        candidate_name: str, 
        job_role: str, 
        scheduled_datetime: str,
        interview_id: str
    ) -> bool:
        """Send interview reminder email to candidate"""
        try:
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured. Skipping email send.")
                return False
            
            # Create candidate interview URL
            # Create candidate interview URL - this should match the route in the frontend
            interview_url = f"{self.frontend_url}/candidate/interview/{interview_id}"
            
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = candidate_email
            msg['Subject'] = f"Interview Reminder - {job_role} Position"
            
            # Email body
            body = f"""
Dear {candidate_name},

This is a friendly reminder about your upcoming interview.

Interview Details:
- Position: {job_role}
- Date & Time: {scheduled_datetime}
- Interview ID: {interview_id}
- Interview Link: {interview_url}

Please click on the interview link at the scheduled time. You will see instructions and a start button.
When you're ready, click the start button to begin the interview.

Best regards,
Interview System Team
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Connect to SMTP server and send email
            logger.info(f"Connecting to SMTP server: {self.smtp_server}:{self.smtp_port}")
            logger.info(f"Using SMTP username: {self.smtp_username}")
            logger.info(f"From email: {self.from_email}")
            
            try:
                # Print all email configuration for debugging
                logger.info("=== EMAIL CONFIGURATION DEBUG ===")
                logger.info(f"SMTP Server: {self.smtp_server}")
                logger.info(f"SMTP Port: {self.smtp_port}")
                logger.info(f"SMTP Username: {self.smtp_username}")
                logger.info(f"Using OAuth2: {settings.USE_OAUTH2}")
                logger.info(f"From Email: {self.from_email}")
                logger.info(f"To Email: {candidate_email}")
                logger.info(f"Email Subject: {msg['Subject']}")
                logger.info("Email Body Preview: " + body[:100] + "...")
                logger.info("=== END EMAIL CONFIGURATION DEBUG ===")
                
                # Create SMTP connection with extended timeout
                logger.info("Creating SMTP connection...")
                server = smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=30)
                
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
                
                # Login - using OAuth2 or password based on settings
                if settings.USE_OAUTH2 and MSAL_AVAILABLE:
                    logger.info("Using OAuth2 authentication")
                    access_token = get_access_token()
                    if not access_token:
                        logger.error("Failed to get OAuth2 access token")
                        logger.info("Falling back to password authentication")
                        server.login(self.smtp_username, self.smtp_password)
                        logger.info("Password authentication successful (fallback)")
                    else:
                        auth_string = generate_oauth2_string(self.smtp_username, access_token)
                        server.auth("XOAUTH2", lambda x: auth_string)
                        logger.info("OAuth2 authentication successful")
                else:
                    if settings.USE_OAUTH2 and not MSAL_AVAILABLE:
                        logger.warning("OAuth2 requested but MSAL module not available. Falling back to password authentication.")
                        logger.warning("To use OAuth2, install the msal package with: pip install msal")
                    
                    logger.info(f"Using password authentication with username: {self.smtp_username}")
                    server.login(self.smtp_username, self.smtp_password)
                    logger.info("Password authentication successful")
                
                # Send email
                text = msg.as_string()
                logger.info(f"Sending email from {self.from_email} to {candidate_email}")
                server.sendmail(self.from_email, candidate_email, text)
                logger.info(f"Email sent successfully")
                
                # Close connection
                server.quit()
                logger.info("SMTP connection closed")
            except smtplib.SMTPAuthenticationError as e:
                logger.error(f"SMTP Authentication Error: {e}")
                raise
            except smtplib.SMTPException as e:
                logger.error(f"SMTP Error: {e}")
                raise
            
            logger.info(f"Interview reminder email sent to {candidate_email}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending reminder email to {candidate_email}: {e}")
            return False
