import api from './api';

/**
 * Email service for handling email-related API calls
 */
const emailService = {
  /**
   * Send interview confirmation email
   * @param {string} candidateEmail - Candidate email
   * @param {string} candidateName - Candidate name
   * @param {string} jobRole - Job role
   * @param {string} scheduledDateTime - Scheduled date and time
   * @param {string} interviewId - Interview ID
   * @returns {Promise} - Promise with the send result
   */
  sendInterviewConfirmation: async (candidateEmail, candidateName, jobRole, scheduledDateTime, interviewId, timezone = 'UTC') => {
    try {
      const response = await api.post('/emails/send-confirmation', {
        candidate_email: candidateEmail,
        candidate_name: candidateName,
        job_role: jobRole,
        scheduled_datetime: scheduledDateTime,
        interview_id: interviewId,
        timezone: timezone
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while sending confirmation email' };
    }
  },

  /**
   * Send custom interview confirmation email
   * @param {string} candidateEmail - Candidate email
   * @param {string} candidateName - Candidate name
   * @param {string} jobRole - Job role
   * @param {string} scheduledDateTime - Scheduled date and time
   * @param {string} interviewId - Interview ID
   * @param {string} customBody - Custom email body content
   * @param {string} timezone - Timezone for the interview
   * @returns {Promise} - Promise with the send result
   */
  sendCustomConfirmationEmail: async (candidateEmail, candidateName, jobRole, scheduledDateTime, interviewId, customBody, attachments = [], timezone = 'UTC') => {
    try {
      // Create form data to handle file uploads
      const formData = new FormData();
      formData.append('candidate_email', candidateEmail);
      formData.append('candidate_name', candidateName);
      formData.append('job_role', jobRole);
      formData.append('scheduled_datetime', scheduledDateTime);
      formData.append('interview_id', interviewId);
      formData.append('custom_body', customBody);
      formData.append('timezone', timezone);
      
      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }
      
      const response = await api.post('/emails/send-custom-confirmation', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while sending custom confirmation email' };
    }
  },

  /**
   * Send interview reminder email
   * @param {string} candidateEmail - Candidate email
   * @param {string} candidateName - Candidate name
   * @param {string} jobRole - Job role
   * @param {string} scheduledDateTime - Scheduled date and time
   * @param {string} interviewId - Interview ID
   * @param {string} timezone - Timezone for the interview
   * @returns {Promise} - Promise with the send result
   */
  sendInterviewReminder: async (candidateEmail, candidateName, jobRole, scheduledDateTime, interviewId, timezone = 'UTC') => {
    try {
      const response = await api.post('/emails/send-reminder', {
        candidate_email: candidateEmail,
        candidate_name: candidateName,
        job_role: jobRole,
        scheduled_datetime: scheduledDateTime,
        interview_id: interviewId,
        timezone: timezone
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while sending reminder email' };
    }
  },

  /**
   * Test email configuration
   * @param {string} testEmail - Test recipient email
   * @returns {Promise} - Promise with the test result
   */
  testEmailConfiguration: async (testEmail) => {
    try {
      const response = await api.post('/emails/test', {
        test_email: testEmail
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while testing email configuration' };
    }
  }
};

export default emailService;