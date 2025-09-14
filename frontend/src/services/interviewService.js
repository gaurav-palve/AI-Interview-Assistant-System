import api from './api';

/**
 * Interview service for handling interview-related API calls
 */
const interviewService = {
  /**
   * Create a new interview
   * @param {Object} interviewData - Interview data
   * @returns {Promise} - Promise with the creation result
   */
  createInterview: async (interviewData) => {
    try {
      const response = await api.post('/interviews', interviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while creating the interview' };
    }
  },

  /**
   * Get a list of interviews with pagination
   * @param {number} page - Page number
   * @param {number} pageSize - Number of items per page
   * @returns {Promise} - Promise with the interviews list
   */
  getInterviews: async (page = 1, pageSize = 10) => {
    try {
      const response = await api.get('/interviews', {
        params: { page, page_size: pageSize }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while fetching interviews' };
    }
  },

  /**
   * Get a specific interview by ID
   * @param {string} interviewId - Interview ID
   * @returns {Promise} - Promise with the interview data
   */
  getInterviewById: async (interviewId) => {
    try {
      const response = await api.get(`/interviews/${interviewId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while fetching the interview' };
    }
  },

  /**
   * Update an existing interview
   * @param {string} interviewId - Interview ID
   * @param {Object} updateData - Updated interview data
   * @returns {Promise} - Promise with the update result
   */
  updateInterview: async (interviewId, updateData) => {
    try {
      const response = await api.put(`/interviews/${interviewId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while updating the interview' };
    }
  },

  /**
   * Delete an interview
   * @param {string} interviewId - Interview ID
   * @returns {Promise} - Promise with the deletion result
   */
  deleteInterview: async (interviewId) => {
    try {
      const response = await api.delete(`/interviews/${interviewId}`);
      return response.data;
    } catch (error) {
      // Enhanced error handling to capture specific backend error messages
      if (error.response?.data?.detail) {
        // If the backend provides a specific error message, use it
        throw { detail: error.response.data.detail };
      } else if (error.response?.status === 404) {
        throw { detail: 'Interview not found or access denied' };
      } else {
        throw { detail: 'An error occurred while deleting the interview' };
      }
    }
  },

  /**
   * Get interview statistics
   * @returns {Promise} - Promise with the statistics data
   */
  getInterviewStatistics: async () => {
    try {
      const response = await api.get('/interviews/stats/summary');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while fetching statistics' };
    }
  },

  /**
   * Upload resume and job description files
   * @param {string} candidateEmail - Candidate email
   * @param {File} jdFile - Job description file
   * @param {File} resumeFile - Resume file
   * @returns {Promise} - Promise with the upload result
   */
  uploadFiles: async (candidateEmail, jdFile, resumeFile) => {
    try {
      const formData = new FormData();
      formData.append('candidate_email', candidateEmail);
      formData.append('jd', jdFile);
      formData.append('resume', resumeFile);

      const response = await api.post('/interviews/upload/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while uploading files' };
    }
  },

  /**
   * Generate MCQs based on resume and job description
   * @param {string} candidateEmail - Candidate email
   * @returns {Promise} - Promise with the generated MCQs
   */
  generateMCQs: async (candidateEmail) => {
    try {
      const response = await api.post('/interviews/generate-mcqs', { candidate_email: candidateEmail });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while generating MCQs' };
    }
  },
  
  /**
   * Get candidate interview by ID (public endpoint)
   * @param {string} interviewId - Interview ID
   * @returns {Promise} - Promise with the interview data
   */
  getCandidateInterview: async (interviewId) => {
    try {
      const response = await api.get(`/candidate/interview/${interviewId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while fetching the interview' };
    }
  },
  
  /**
   * Generate MCQs for candidate interview (public endpoint)
   * @param {string} interviewId - Interview ID
   * @returns {Promise} - Promise with the generated MCQs
   */
  generateCandidateMCQs: async (interviewId) => {
    try {
      const response = await api.post(`/candidate/generate-mcqs/${interviewId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while generating MCQs' };
    }
  },
  
  /**
   * Submit candidate answers for an interview (public endpoint)
   * @param {string} interviewId - Interview ID
   * @param {string} candidateEmail - Candidate email
   * @param {Array} responses - Array of responses with question, selected answer, correct answer, and is_correct flag
   * @param {number} totalScore - Total score achieved
   * @param {number} maxScore - Maximum possible score
   * @returns {Promise} - Promise with the submission result
   */
  submitCandidateAnswers: async (interviewId, candidateEmail, responses, totalScore, maxScore) => {
    try {
      const submission = {
        interview_id: interviewId,
        candidate_email: candidateEmail,
        responses: responses,
        total_score: totalScore,
        max_score: maxScore
      };
      
      const response = await api.post(`/candidate/submit-answers/${interviewId}`, submission);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while submitting answers' };
    }
  },

  /**
   * Start the camera with specified resolution
   * @param {number} width - Camera width in pixels
   * @param {number} height - Camera height in pixels
   * @returns {Promise} - Promise with the start result
   */
  startCamera: async (width = 640, height = 480, enableDetection = false) => {
    try {
      const response = await api.post('/camera/start', {
        width,
        height,
        enable_detection: enableDetection
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while starting the camera' };
    }
  },
  
  /**
   * Toggle cheating detection
   * @param {boolean} enable - Whether to enable detection
   * @returns {Promise} - Promise with the toggle result
   */
  toggleDetection: async (enable) => {
    try {
      const response = await api.post('/camera/toggle_detection', { enable });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while toggling detection' };
    }
  },

  /**
   * Stop the camera
   * @returns {Promise} - Promise with the stop result
   */
  stopCamera: async () => {
    try {
      const response = await api.post('/camera/stop');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while stopping the camera' };
    }
  },

  /**
   * Get camera status and statistics
   * @returns {Promise} - Promise with the camera status and statistics
   */
  getCameraStatus: async () => {
    try {
      const response = await api.get('/camera/status');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while getting camera status' };
    }
  },

  /**
   * Upload resumes and job description for screening
   * @param {File} zipFile - Zip file containing resumes
   * @param {File} jdFile - Job description file
   * @returns {Promise} - Promise with the screening results
   */
  screenResumes: async (zipFile, jdFile) => {
    try {
      const formData = new FormData();
      formData.append('zip_file', zipFile);
      formData.append('jd_file', jdFile);

      const response = await api.post('/resume-screening', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while screening resumes' };
    }
  }
};

export default interviewService;
