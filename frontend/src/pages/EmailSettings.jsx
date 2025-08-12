import { useState } from 'react';
import emailService from '../services/emailService';

// Material UI Icons
import {
  Email as EmailIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

/**
 * EmailSettings page component
 * Allows testing and configuring email functionality
 */
function EmailSettings() {
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handle test email submission
   * @param {Event} e - Form submit event
   */
  const handleTestEmail = async (e) => {
    e.preventDefault();
    
    if (!testEmail) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSending(true);
    setError(null);
    setSuccess(false);
    
    try {
      console.log('Sending test email to:', testEmail);
      const response = await emailService.testEmailConfiguration(testEmail);
      console.log('Test email response:', response);
      setSuccess(true);
    } catch (err) {
      console.error('Error testing email configuration:', err);
      
      // Enhanced error handling
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else if (err.detail) {
        setError(err.detail);
      } else {
        setError('Failed to send test email. Please check your email configuration and network connection.');
      }
      
      // Log additional details for debugging
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Email Settings</h1>
      </div>

      {/* Email Configuration Info */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <SettingsIcon className="h-5 w-5 mr-2 text-primary-600" />
          Email Configuration
        </h2>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex">
            <InfoIcon className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Email settings are configured in the backend <code>.env</code> file. This page allows you to test if your email configuration is working correctly.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Current Configuration</h3>
            <p className="mt-1 text-sm text-gray-500">
              The application is configured to send emails through the SMTP server specified in the backend environment variables.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-500">SMTP Server</p>
              <p className="mt-1 text-gray-900">smtp-mail.outlook.com</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-500">SMTP Port</p>
              <p className="mt-1 text-gray-900">587</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-500">Email Provider</p>
              <p className="mt-1 text-gray-900">Microsoft Outlook</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-500">Authentication</p>
              <p className="mt-1 text-gray-900">Username and Password</p>
            </div>
          </div>
        </div>
      </div>

      {/* Test Email Form */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <EmailIcon className="h-5 w-5 mr-2 text-primary-600" />
          Test Email Configuration
        </h2>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <ErrorIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                {error.includes('SMTP credentials') && (
                  <p className="mt-2 text-sm text-red-700">
                    Please check your <code>.env</code> file and make sure you've set the correct SMTP credentials.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <div className="flex">
              <CheckIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Test email sent successfully! Please check the inbox of {testEmail}.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleTestEmail} className="space-y-4">
          <div>
            <label htmlFor="test_email" className="form-label">
              Test Recipient Email
            </label>
            <input
              type="email"
              id="test_email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email address to receive test email"
              className="form-input"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter an email address where you want to receive the test email.
            </p>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSending || !testEmail}
              className="btn btn-primary"
            >
              {isSending ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                <span className="flex items-center">
                  <SendIcon className="h-5 w-5 mr-1" />
                  Send Test Email
                </span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Email Usage Guide */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <InfoIcon className="h-5 w-5 mr-2 text-primary-600" />
          Email Usage Guide
        </h2>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            The AI Interview Assistant uses email functionality for the following purposes:
          </p>
          
          <div className="space-y-2">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 text-primary-600">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                  1
                </span>
              </div>
              <div className="ml-3">
                <p className="text-gray-700">
                  <strong>Interview Confirmations:</strong> Sent to candidates when an interview is scheduled.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 text-primary-600">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                  2
                </span>
              </div>
              <div className="ml-3">
                <p className="text-gray-700">
                  <strong>Interview Reminders:</strong> Sent to candidates before their scheduled interview.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
            <div className="flex">
              <InfoIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Important:</strong> For the email functionality to work, you need to set up your Outlook account credentials in the backend <code>.env</code> file with the following variables:
                </p>
                <pre className="mt-2 text-sm bg-gray-100 p-2 rounded">
                  SMTP_SERVER=smtp-mail.outlook.com
                  SMTP_PORT=587
                  SMTP_USERNAME=your_outlook_email@outlook.com
                  SMTP_PASSWORD=your_password_or_app_password
                  FROM_EMAIL=your_outlook_email@outlook.com
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailSettings;