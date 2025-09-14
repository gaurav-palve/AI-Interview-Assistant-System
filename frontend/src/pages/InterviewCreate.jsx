import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
  // Initialize react-hook-form
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      candidate_name: '',
      candidate_email: '',
      job_role: '',
      scheduled_datetime: format(new Date(Date.now() + 86400000), "yyyy-MM-dd'T'HH:mm"), // Default to tomorrow
      status: 'scheduled'
    }
  });

  // Watch form values for email preview
  const candidateName = watch('candidate_name');
  const candidateEmail = watch('candidate_email');
  const jobRole = watch('job_role');
  const scheduledDateTime = watch('scheduled_datetime');
  
  // Update email body when form values change
  useEffect(() => {
    const updatedEmailBody = `Dear ${candidateName || 'Candidate'},

Your interview for the ${jobRole || 'Job Position'} position has been successfully scheduled.

Interview Details:
- Position: ${jobRole || 'Job Position'}
- Date & Time: ${scheduledDateTime ? format(new Date(scheduledDateTime), 'PPpp') : 'Scheduled Date and Time'}
- Interview Link: ${window.location.origin}/candidate/interview/[Interview ID will be generated]

Please click on the interview link at the scheduled time. You will see instructions and a start button. When you're ready, click the start button to begin the interview.

Best regards,
Interview System Team`;
    
    setEmailBody(updatedEmailBody);
  }, [candidateName, candidateEmail, jobRole, scheduledDateTime]);

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
   * Send confirmation email to candidate
   * @param {Object} interviewData - Interview data
   */
  const sendConfirmationEmail = async (interviewData) => {
    setIsSendingEmail(true);
    try {
      // The email body is already updated with the form values, just replace the interview link
      const customEmailBody = emailBody
        .replace(`${window.location.origin}/candidate/interview/[Interview ID will be generated]`, `${window.location.origin}/candidate/interview/${interviewData.id}`);

      // Send the custom email
      await emailService.sendCustomConfirmationEmail(
        interviewData.candidate_email,
        interviewData.candidate_name,
        interviewData.job_role,
        format(new Date(interviewData.scheduled_datetime), 'PPpp'),
        interviewData.id,
        customEmailBody
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
      
      // Convert the datetime string to a Date object and then to ISO string
      const scheduledDate = new Date(data.scheduled_datetime);
      
      // Create the interview data object
      const interviewData = {
        candidate_name: data.candidate_name,
        candidate_email: data.candidate_email,
        job_role: data.job_role,
        scheduled_datetime: scheduledDate.toISOString(), // Convert to ISO string
        status: data.status,
        resume_uploaded: false,
        jd_uploaded: false
      };
      
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
        scheduled_datetime: data.scheduled_datetime
      });
      
      // Send confirmation email
      console.log('Sending confirmation email...');
      await sendConfirmationEmail({
        id: response.interview_id,
        candidate_email: data.candidate_email,
        candidate_name: data.candidate_name,
        job_role: data.job_role,
        scheduled_datetime: data.scheduled_datetime
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