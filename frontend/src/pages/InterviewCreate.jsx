import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import interviewService from '../services/interviewService';
import emailService from '../services/emailService';
import { format } from 'date-fns';

// Material UI Icons
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Upload as UploadIcon,
  Email as EmailIcon
} from '@mui/icons-material';

/**
 * InterviewCreate page component
 * Form for creating a new interview with file upload and email notification
 */
function InterviewCreate() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const [createdInterview, setCreatedInterview] = useState(null);
  
  // Email content state variable
  const [emailBody, setEmailBody] = useState("");
  // Email attachments state
  const [emailAttachments, setEmailAttachments] = useState([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillJobRole = searchParams.get('job_role') || '';
  const prefillJobPostingId = searchParams.get('job_posting_id') || null;
  
  // Initialize react-hook-form
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      candidate_name: '',
      candidate_email: '',
      job_role: prefillJobRole,
      scheduled_datetime: format(new Date(Date.now() + 86400000), "yyyy-MM-dd'T'HH:mm"), // Default to tomorrow
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Default to browser timezone
      status: 'scheduled'
    }
  });

  // Watch form values for email preview
  const candidateName = watch('candidate_name');
  const candidateEmail = watch('candidate_email');
  const jobRole = watch('job_role');
  const scheduledDateTime = watch('scheduled_datetime');
  const selectedTimezone = watch('timezone');
  
  // Update email body when form values change
  useEffect(() => {
    const updatedEmailBody = `Dear ${candidateName || 'Candidate'},

Your interview for the ${jobRole || 'Job Position'} position has been successfully scheduled.

Interview Details:
- Position: ${jobRole || 'Job Position'}
- Date & Time: ${scheduledDateTime ? format(new Date(scheduledDateTime), 'PPpp') : 'Scheduled Date and Time'} (${selectedTimezone})
- Interview Link: ${window.location.origin}/candidate/interview/[Interview ID will be generated]

Please click on the interview link at the scheduled time. You will see instructions and a start button. When you're ready, click the start button to begin the interview.

Best regards,
Interview System Team`;
    
    setEmailBody(updatedEmailBody);
  }, [candidateName, candidateEmail, jobRole, scheduledDateTime, selectedTimezone]);

  /**
   * Handle resume file selection
   * @param {Event} e - Change event
   */
  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.docx')) {
        setError('Resume must be a PDF or DOCX file');
        setResumeFile(null);
        e.target.value = null;
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Resume file size must be less than 5MB');
        setResumeFile(null);
        e.target.value = null;
        return;
      }
      
      setResumeFile(file);
      setError(null);
    }
  };

  /**
   * Handle job description file selection
   * @param {Event} e - Change event
   */
  const handleJdChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.docx')) {
        setError('Job description must be a PDF or DOCX file');
        setJdFile(null);
        e.target.value = null;
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Job description file size must be less than 5MB');
        setJdFile(null);
        e.target.value = null;
        return;
      }
      
      setJdFile(file);
      setError(null);
    }
  };
  
  /**
   * Handle email attachment file selection
   * @param {Event} e - Change event
   */
  const handleEmailAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Validate file size (max 5MB per file)
      const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setError(`Some attachments exceed the 5MB size limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
        e.target.value = null;
        return;
      }
      
      // Add the files to the attachments array
      setEmailAttachments(prev => [...prev, ...files]);
      setError(null);
    }
  };
  
  /**
   * Remove an attachment from the list
   * @param {number} index - Index of the attachment to remove
   */
  const removeAttachment = (index) => {
    setEmailAttachments(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Send confirmation email to candidate
   * @param {Object} interviewData - Interview data
   */
  const sendConfirmationEmail = async (interviewData) => {
    setIsSendingEmail(true);
    try {
      // The email body is already updated with the form values, just replace the interview link
      const customEmailBody = emailBody
        .replace(`${window.location.origin}/candidate/interview/[Interview ID will be generated]`, `${window.location.origin}/candidate/interview/${interviewData.id}`);

      // Send the custom email with attachments
      await emailService.sendCustomConfirmationEmail(
        interviewData.candidate_email,
        interviewData.candidate_name,
        interviewData.job_role,
        format(new Date(interviewData.scheduled_datetime), 'PPpp'),
        interviewData.id,
        customEmailBody,
        emailAttachments,
        interviewData.timezone || 'UTC'
      );
      setSuccess('Interview created and confirmation email sent successfully!');
    } catch (err) {
      console.error('Error sending confirmation email:', err);
      setError('Interview created but failed to send confirmation email. You can try sending it again later.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  /**
   * Handle form submission
   * @param {Object} data - Form data
   */
  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate files
      if (!resumeFile) {
        setError('Resume file is required');
        setIsLoading(false);
        return;
      }
      
      if (!jdFile) {
        setError('Job description file is required');
        setIsLoading(false);
        return;
      }
      // Create a date object from the input (in local timezone)
      const localDate = new Date(data.scheduled_datetime);
      
      // Calculate the offset between local timezone and selected timezone
      const selectedTimezoneOffset = getTimezoneOffset(data.timezone);
      const localTimezoneOffset = new Date().getTimezoneOffset() * -1;
      const offsetDiff = selectedTimezoneOffset - localTimezoneOffset;
      
      // Adjust the date by the offset difference
      const scheduledDate = new Date(localDate.getTime() - offsetDiff * 60000);
      
      console.log('Local date:', localDate);
      console.log('Selected timezone:', data.timezone);
      console.log('Selected timezone offset:', selectedTimezoneOffset);
      console.log('Local timezone offset:', localTimezoneOffset);
      console.log('Offset difference:', offsetDiff);
      console.log('Adjusted date:', scheduledDate);
      
      // Create the interview data object
      const interviewData = {
        candidate_name: data.candidate_name,
        candidate_email: data.candidate_email,
        job_role: data.job_role,
        scheduled_datetime: scheduledDate.toISOString(), // Convert to ISO string
        timezone: data.timezone, // Include the timezone
        status: data.status,
        resume_uploaded: false,
        jd_uploaded: false
      };
      // Attach job_posting_id when creating from a job posting card
      if (prefillJobPostingId) {
        interviewData.job_posting_id = prefillJobPostingId;
      }
      
      console.log('Creating interview with data:', interviewData);
      
      // Call the API to create the interview
      const response = await interviewService.createInterview(interviewData);
      console.log('Interview created:', response);
      
      // Upload files
      console.log('Uploading files...');
      const uploadResponse = await interviewService.uploadFiles(data.candidate_email, jdFile, resumeFile);
      console.log('Files uploaded:', uploadResponse);
      
      // Store created interview data
      setCreatedInterview({
        ...response,
        id: response.interview_id, // Make sure id is set correctly
        candidate_email: data.candidate_email,
        candidate_name: data.candidate_name,
        job_role: data.job_role,
        scheduled_datetime: data.scheduled_datetime,
        timezone: data.timezone
      });
      
      // Send confirmation email
      console.log('Sending confirmation email...');
      await sendConfirmationEmail({
        id: response.interview_id,
        candidate_email: data.candidate_email,
        candidate_name: data.candidate_name,
        job_role: data.job_role,
        scheduled_datetime: data.scheduled_datetime,
        timezone: data.timezone
      });
      
      setSuccess('Interview created successfully!');
    } catch (err) {
      console.error('Error creating interview:', err);
      setError(err.detail || 'Failed to create interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get timezone offset in minutes
   * @param {string} timezone - Timezone identifier
   * @returns {number} - Timezone offset in minutes
   */
  function getTimezoneOffset(timezone) {
    try {
      const date = new Date();
      const options = { timeZone: timezone, timeZoneName: 'short' };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const timeZonePart = formatter.formatToParts(date)
        .find(part => part.type === 'timeZoneName');
      
      if (!timeZonePart) return 0;
      
      const timeZoneName = timeZonePart.value;
      
      // Parse the timezone offset from the name (e.g., "GMT+11")
      const match = timeZoneName.match(/GMT([+-])(\d+)(?::(\d+))?/);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        const hours = parseInt(match[2], 10);
        const minutes = match[3] ? parseInt(match[3], 10) : 0;
        return sign * (hours * 60 + minutes);
      }
      
      // Handle special cases
      if (timeZoneName === 'UTC') return 0;
      if (timeZoneName === 'EST') return -5 * 60;
      if (timeZoneName === 'CST') return -6 * 60;
      if (timeZoneName === 'MST') return -7 * 60;
      if (timeZoneName === 'PST') return -8 * 60;
      
      // Default to UTC if parsing fails
      return 0;
    } catch (error) {
      console.error('Error getting timezone offset:', error);
      return 0;
    }
  }

  /**
   * Navigate to interviews list
   */
  const handleViewInterviews = () => {
    navigate('/interviews');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Create New Interview</h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleViewInterviews}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  View All Interviews
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Candidate Name */}
            <div className="sm:col-span-3">
              <label htmlFor="candidate_name" className="form-label">
                Candidate Name
              </label>
              <input
                type="text"
                id="candidate_name"
                {...register('candidate_name', { 
                  required: 'Candidate name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' }
                })}
                className={`form-input ${errors.candidate_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.candidate_name && (
                <p className="mt-1 text-sm text-red-600">{errors.candidate_name.message}</p>
              )}
            </div>

            {/* Candidate Email */}
            <div className="sm:col-span-3">
              <label htmlFor="candidate_email" className="form-label">
                Candidate Email
              </label>
              <input
                type="email"
                id="candidate_email"
                {...register('candidate_email', { 
                  required: 'Candidate email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className={`form-input ${errors.candidate_email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.candidate_email && (
                <p className="mt-1 text-sm text-red-600">{errors.candidate_email.message}</p>
              )}
            </div>

            {/* Job Role */}
            <div className="sm:col-span-6">
              <label htmlFor="job_role" className="form-label">
                Job Role
              </label>
              <input
                type="text"
                id="job_role"
                {...register('job_role', { 
                  required: 'Job role is required',
                  minLength: { value: 3, message: 'Job role must be at least 3 characters' }
                })}
                className={`form-input ${errors.job_role ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.job_role && (
                <p className="mt-1 text-sm text-red-600">{errors.job_role.message}</p>
              )}
            </div>

            {/* Scheduled Date and Time */}
            <div className="sm:col-span-3">
              <label htmlFor="scheduled_datetime" className="form-label">
                Scheduled Date and Time
              </label>
              <input
                type="datetime-local"
                id="scheduled_datetime"
                {...register('scheduled_datetime', { 
                  required: 'Scheduled date and time is required',
                  validate: value => new Date(value) > new Date() || 'Scheduled time must be in the future'
                })}
                className={`form-input ${errors.scheduled_datetime ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.scheduled_datetime && (
                <p className="mt-1 text-sm text-red-600">{errors.scheduled_datetime.message}</p>
              )}
            </div>

            {/* Timezone */}
            <div className="sm:col-span-3">
              <label htmlFor="timezone" className="form-label">
                Timezone
              </label>
              <select
                id="timezone"
                {...register('timezone', { required: 'Timezone is required' })}
                className={`form-input ${errors.timezone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Anchorage">Alaska Time</option>
                <option value="America/Adak">Hawaii-Aleutian Time</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Central European Time (CET)</option>
                <option value="Asia/Kolkata">India (IST)</option>
                <option value="Asia/Tokyo">Japan (JST)</option>
                <option value="Asia/Shanghai">China (CST)</option>
                <option value="Australia/Sydney">Australia Eastern Time</option>
              </select>
              {errors.timezone && (
                <p className="mt-1 text-sm text-red-600">{errors.timezone.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="sm:col-span-3">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                {...register('status', { required: 'Status is required' })}
                className={`form-input ${errors.status ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>
          </div>

          {/* File Upload Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <UploadIcon className="h-5 w-5 mr-2 text-primary-600" />
              Upload Files
            </h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              {/* Resume Upload */}
              <div>
                <label htmlFor="resume" className="form-label">
                  Resume
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <div className="flex flex-col items-center">
                      <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="resume-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>Upload resume</span>
                          <input
                            id="resume-upload"
                            name="resume-upload"
                            type="file"
                            className="sr-only"
                            accept=".pdf,.docx"
                            onChange={handleResumeChange}
                            required
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF or DOCX up to 5MB
                      </p>
                    </div>
                    {resumeFile && (
                      <div className="mt-2 flex items-center justify-center text-sm text-gray-600">
                        <span className="text-gray-900 font-medium">{resumeFile.name}</span>
                        <span className="ml-2 text-gray-500">({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Description Upload */}
              <div>
                <label htmlFor="jd" className="form-label">
                  Job Description
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <div className="flex flex-col items-center">
                      <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="jd-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>Upload job description</span>
                          <input
                            id="jd-upload"
                            name="jd-upload"
                            type="file"
                            className="sr-only"
                            accept=".pdf,.docx"
                            onChange={handleJdChange}
                            required
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF or DOCX up to 5MB
                      </p>
                    </div>
                    {jdFile && (
                      <div className="mt-2 flex items-center justify-center text-sm text-gray-600">
                        <span className="text-gray-900 font-medium">{jdFile.name}</span>
                        <span className="ml-2 text-gray-500">({(jdFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Preview Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <EmailIcon className="h-5 w-5 mr-2 text-primary-600" />
              Email Notification Preview
            </h3>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <div className="flex">
                <InfoIcon className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    A confirmation email will be sent to the candidate with interview details and instructions.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-md p-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">To: {candidateEmail || 'candidate@example.com'}</p>
                <p className="text-sm text-gray-500">Subject: Interview Confirmation - {jobRole || 'Job Position'}</p>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  {/* Editable email body */}
                  <textarea
                    id="emailBody"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm text-gray-700 focus:border-primary-500 focus:ring-primary-500"
                    rows="12"
                  />
                </div>
              </div>
            </div>
            
            {/* Email Attachments Section */}
            {/* Email Attachments Section */}
            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Email Attachments (Optional)</h4>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <UploadIcon className="h-12 w-12 text-gray-400" />
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <label
                      htmlFor="email-attachment-upload"
                      className="relative cursor-pointer font-medium text-primary-600 hover:text-primary-700 focus-within:outline-none"
                    >
                      <span>Upload attachments</span>
                      <input
                        id="email-attachment-upload"
                        name="email-attachment-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        onChange={handleEmailAttachmentChange}
                      />
                    </label>
                    <span className="ml-1">or drag and drop</span>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Any file type up to 5MB each
                  </p>
                </div>
              </div>
              
              {/* Display selected attachments */}
              {emailAttachments.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Selected Attachments:</h5>
                  <ul className="space-y-2">
                    {emailAttachments.map((file, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <UploadIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="ml-4 flex-shrink-0 text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/interviews')}
              className="btn btn-outline"
            >
              <CancelIcon className="h-5 w-5 mr-1" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isSendingEmail}
              className="btn btn-primary"
            >
              {isLoading || isSendingEmail ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isLoading ? 'Creating...' : 'Sending Email...'}
                </span>
              ) : (
                <span className="flex items-center">
                  <SaveIcon className="h-5 w-5 mr-1" />
                  Create Interview
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InterviewCreate;