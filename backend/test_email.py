"""
Test script to verify email functionality with Outlook account.
This script sends a test email using the configured SMTP settings.
"""
import asyncio
import os
import sys
from dotenv import load_dotenv
from app.services.email_service import EmailService
import smtplib

async def test_email_service():
    """Test the email service by sending a test email"""
    print("\n===== Email Configuration Test =====\n")
    
    # Load environment variables
    load_dotenv()
    print("✅ Loaded environment variables from .env file")
    
    # Get email settings from environment variables
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("FROM_EMAIL")
    
    print("\nEmail Configuration:")
    print(f"SMTP Server: {smtp_server}")
    print(f"SMTP Port: {smtp_port}")
    print(f"SMTP Username: {smtp_username}")
    print(f"From Email: {from_email}")
    print(f"SMTP Password: {'*' * len(smtp_password) if smtp_password else 'Not set'}")
    
    # Validate configuration
    config_valid = True
    
    if not smtp_server:
        print("\n❌ SMTP_SERVER is not set in .env file")
        config_valid = False
    
    if not smtp_port:
        print("\n❌ SMTP_PORT is not set in .env file")
        config_valid = False
    
    if not smtp_username:
        print("\n❌ SMTP_USERNAME is not set in .env file")
        config_valid = False
    
    if not smtp_password:
        print("\n❌ SMTP_PASSWORD is not set in .env file")
        config_valid = False
        print("   If you have two-factor authentication enabled, you need to use an app password.")
        print("   See the EMAIL_SETUP_GUIDE.md file for instructions.")
    
    if not from_email:
        print("\n❌ FROM_EMAIL is not set in .env file")
        config_valid = False
    
    if not config_valid:
        print("\n❌ Email configuration is incomplete. Please update your .env file.")
        return
    
    print("\n✅ Email configuration is complete")
    
    # Test SMTP connection
    print("\nTesting SMTP connection...")
    try:
        server = smtplib.SMTP(smtp_server, int(smtp_port))
        server.ehlo()
        server.starttls()
        print("✅ Successfully connected to SMTP server")
        
        # Test authentication
        try:
            server.login(smtp_username, smtp_password)
            print("✅ Successfully authenticated with SMTP server")
            server.quit()
        except smtplib.SMTPAuthenticationError as e:
            print(f"❌ Authentication failed: {str(e)}")
            print("   Please check your username and password.")
            print("   If you have two-factor authentication enabled, you need to use an app password.")
            return
        except Exception as e:
            print(f"❌ Error during authentication: {str(e)}")
            return
    except Exception as e:
        print(f"❌ Failed to connect to SMTP server: {str(e)}")
        return
    
    # Create email service
    email_service = EmailService()
    
    # Test recipient email
    test_recipient = input("\nEnter test recipient email: ")
    
    # Send test email
    print(f"\nSending test email to {test_recipient}...")
    try:
        result = await email_service.send_interview_confirmation(
            candidate_email=test_recipient,
            candidate_name="Test Candidate",
            job_role="Software Engineer",
            scheduled_datetime="2025-08-15 10:00 AM",
            interview_id="TEST-123"
        )
        
        if result:
            print("\n✅ Email sent successfully!")
            print("The email functionality is working correctly with your Outlook account.")
        else:
            print("\n❌ Failed to send email.")
            print("Please check your SMTP settings and make sure your Outlook account is configured correctly.")
    except Exception as e:
        print(f"\n❌ Error sending email: {str(e)}")
        print("\nCommon issues:")
        print("1. Incorrect SMTP server or port")
        print("2. Invalid username or password")
        print("3. Two-factor authentication is enabled (you need to use an app password)")
        print("4. Your email provider is blocking the connection")
        print("5. Network connectivity issues")

if __name__ == "__main__":
    asyncio.run(test_email_service())