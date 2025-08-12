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
  sendInterviewConfirmation: async (candidateEmail, candidateName, jobRole, scheduledDateTime, interviewId) => {
    try {
      const response = await api.post('/emails/send-confirmation', {
        candidate_email: candidateEmail,
        candidate_name: candidateName,
        job_role: jobRole,
        scheduled_datetime: scheduledDateTime,
        interview_id: interviewId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while sending confirmation email' };
    }
  },

  /**
   * Send interview reminder email
   * @param {string} candidateEmail - Candidate email
   * @param {string} candidateName - Candidate name
   * @param {string} jobRole - Job role
   * @param {string} scheduledDateTime - Scheduled date and time
   * @param {string} interviewId - Interview ID
   * @returns {Promise} - Promise with the send result
   */
  sendInterviewReminder: async (candidateEmail, candidateName, jobRole, scheduledDateTime, interviewId) => {
    try {
      const response = await api.post('/emails/send-reminder', {
        candidate_email: candidateEmail,
        candidate_name: candidateName,
        job_role: jobRole,
        scheduled_datetime: scheduledDateTime,
        interview_id: interviewId
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