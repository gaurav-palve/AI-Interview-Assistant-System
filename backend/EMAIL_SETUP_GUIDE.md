# Email Setup Guide for Outlook

This guide will help you set up your Outlook email account to work with the AI Interview Assistant application.

## Prerequisites

1. An Outlook email account (outlook.com, hotmail.com, live.com, or Microsoft 365)
2. Access to your Outlook account settings

## Step 1: Generate an App Password (If you have 2FA enabled)

If you have two-factor authentication (2FA) enabled on your Outlook account, you'll need to generate an app password:

1. Go to [Microsoft Account Security](https://account.microsoft.com/security)
2. Sign in with your Outlook account
3. Navigate to "Security" > "Advanced security options"
4. Under "App passwords", click "Create a new app password"
5. Copy the generated password (you'll need it for the next step)

## Step 2: Update the .env File

1. Open the `.env` file in the backend directory
2. Update the SMTP settings with your Outlook credentials:

```
SMTP_SERVER='smtp-mail.outlook.com'
SMTP_PORT='587'
SMTP_USERNAME='your_outlook_email@outlook.com'
SMTP_PASSWORD='your_password_or_app_password'
FROM_EMAIL='your_outlook_email@outlook.com'
```

Replace:
- `your_outlook_email@outlook.com` with your actual Outlook email address
- `your_password_or_app_password` with your regular password (if 2FA is not enabled) or the app password you generated in Step 1

## Step 3: Test the Email Functionality

1. Run the test script to verify that the email functionality works:

```
cd backend
python test_email.py
```

2. When prompted, enter a test recipient email address (you can use your own email to test)
3. Check if the test email was sent successfully

## Troubleshooting

If you encounter issues sending emails, check the following:

1. **Incorrect SMTP Settings**: Verify that the SMTP server and port are correct for Outlook
2. **Authentication Issues**: Make sure your username and password are correct
3. **Security Settings**: Some Outlook accounts have security settings that block "less secure apps". You may need to:
   - Use an app password instead of your regular password
   - Temporarily lower your account security settings (not recommended for production)
4. **Connection Issues**: Make sure your network allows outgoing connections on port 587

## Using Email in the Application

Once the email functionality is set up correctly, the application will automatically send:

1. **Interview Confirmation Emails**: When a new interview is scheduled
2. **Interview Reminder Emails**: Before scheduled interviews

You can customize the email templates in `backend/app/services/email_service.py` if needed.

## Important Notes

- **Security**: Never commit your actual password to version control
- **Rate Limits**: Outlook may have rate limits on how many emails you can send
- **Production Use**: For production use, consider using a dedicated email service like SendGrid or Mailgun