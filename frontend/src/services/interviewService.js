import api from './api';
import axios from 'axios';

// Track current MCQ generation requests
let currentMcqRequest = null;
let currentCandidateMcqRequest = null;

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
      const response = await api.post('/interviews/create-interview', interviewData);
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
      const response = await api.get('/interviews/list-interviews', {
        params: { page, page_size: pageSize },
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
      const response = await api.get(`/interviews/get-interview/${interviewId}`);
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
      const response = await api.put(`/interviews/update-interview/${interviewId}`, updateData);
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
      const response = await api.delete(`/interviews/delete-interview/${interviewId}`);
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

      // Get the token from localStorage
      const token = localStorage.getItem('access_token');
      
      const response = await api.post('/interviews/resume/upload-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Token will be added by the api interceptor automatically
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
      // Cancel any in-flight request
      if (currentMcqRequest) {
        currentMcqRequest.cancel("Operation canceled due to new request");
      }
      
      // Create a new cancelable request
      const cancelToken = axios.CancelToken.source();
      currentMcqRequest = cancelToken;
      
      // Add request ID for tracking
      const requestId = `mcq_${candidateEmail}_${Date.now()}`;
      
      const response = await api.post('/interviews/generate-mcqs',
        {
          candidate_email: candidateEmail,
          request_id: requestId
        },
        {
          cancelToken: cancelToken.token,
          timeout: 60000 // 60 second timeout
        }
      );
      
      // Clear the current request reference
      currentMcqRequest = null;
      return response.data;
    } catch (error) {
      // Handle cancellation
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
        throw { detail: 'Request canceled due to new request' };
      }
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
      // Cancel any in-flight request
      if (currentCandidateMcqRequest) {
        currentCandidateMcqRequest.cancel("Operation canceled due to new request");
      }
      
      // Create a new cancelable request
      const cancelToken = axios.CancelToken.source();
      currentCandidateMcqRequest = cancelToken;
      
      // Add request ID for tracking
      const requestId = `candidate_mcq_${interviewId}_${Date.now()}`;
      
      const response = await api.post(`/candidate/generate-mcqs/${interviewId}`,
        { request_id: requestId },
        {
          cancelToken: cancelToken.token,
          timeout: 60000 // 60 second timeout
        }
      );
      
      // Clear the current request reference
      currentCandidateMcqRequest = null;
      return response.data;
    } catch (error) {
      // Handle cancellation
      if (axios.isCancel(error)) {
        console.log('Candidate MCQ request canceled:', error.message);
        throw { detail: 'Request canceled due to new request' };
      }
      throw error.response?.data || { detail: 'An error occurred while generating MCQs' };
    }
  },
  
  /**
   * Get MCQs for candidate interview (public endpoint)
   * @param {string} interviewId - Interview ID
   * @returns {Promise} - Promise with the MCQs
   */
  getCandidateMCQs: async (interviewId) => {
    try {
      console.log(`Fetching MCQs for interview ID: ${interviewId}`);
      const response = await api.get(`/candidate/get-mcqs/${interviewId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while fetching MCQs' };
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

      const response = await api.post('/screening/resume-screening', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while screening resumes' };
    }
  },

  /**
   * Get candidate assessment reports with pagination and filtering
   * @param {number} page - Page number
   * @param {number} pageSize - Number of items per page
   * @param {Object} filters - Optional filters (candidate_name, candidate_email, job_role, interview_id)
   * @returns {Promise} - Promise with the reports data
   */
  getCandidateReports: async (page = 1, pageSize = 10, filters = {}) => {
    try {
      const params = {
        page,
        page_size: pageSize,
        ...filters
      };

      const response = await api.get('/reports/candidate_reports', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while fetching candidate reports' };
    }
  },

  /**
   * Get candidate reports for a specific job posting
   * @param {string} jobPostingId - Job posting id
   * @param {number} page - Page number
   * @param {number} pageSize - Page size
   * @param {Object} filters - Optional filters
   */
  getJobPostingCandidateReports: async (jobPostingId, page = 1, pageSize = 10, filters = {}) => {
    try {
      const params = {
        job_posting_id: jobPostingId,
        page,
        page_size: pageSize,
        ...filters
      };
      const response = await api.get('/reports/job_posting_candidate_reports', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while fetching job posting candidate reports' };
    }
  },
  
  /**
   * Get candidate report by interview ID
   * @param {string} interviewId - Interview ID
   * @returns {Promise} - Promise with the report data
   */
  getCandidateReportById: async (interviewId) => {
    try {
      const response = await api.get(`/reports/candidate_report/${interviewId}`);
      // Backend returns { reports: <reportObject> }.
      // Return the inner report object for convenience to callers.
      return response.data?.reports ?? response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while fetching the candidate report' };
    }
  },

  /**
   * Download a candidate report PDF
   * @param {string} interviewId - Interview ID
   * @returns {Promise} - Promise with the PDF blob
   */
  downloadReportPdf: async (interviewId) => {
    try {
      const response = await api.get(`/reports/download-report-pdf?interview_id=${interviewId}`, {
        responseType: 'blob'
        
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Candidate_Assessment_Report_${interviewId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error.response?.data || { detail: 'An error occurred while downloading the report PDF' };
    }
  },

  /**
     * Get job statistics (status-wise counts)
     * @returns {Promise}
     */
    getJobStatistics: async () => {
      try {
        const response = await api.get('/dashboard-stats/get-job-statistics');
        return response.data;
      } catch (error) {
        throw error.response?.data || { detail: 'An error occurred while fetching job statistics' };
      }
    },
  
    /**
     * Get total users, total roles, and role-wise user counts
     * @returns {Promise}
     */
    getUserRoleStatistics: async () => {
      try {
        const response = await api.get('/dashboard-stats/user-role-statistics');
        return response.data;
      } catch (error) {
        throw error.response?.data || {
          detail: 'An error occurred while fetching user role statistics'
        };
      }
    },
  
    /**
     * Get role statistics
     * @returns {Promise}
     */
    getRoleStatistics: async () => {
      try {
        const response = await api.get('/dashboard-stats/get-roles-stats');
        return response.data;
      } catch (error) {
        throw error.response?.data || {
          detail: 'An error occurred while fetching role statistics'
        };
      }
    },

    /**
     * Get user statistics (total, active, inactive)
     * @returns {Promise}
     */
    getUserStatistics: async () => {
      try {
        const response = await api.get('/dashboard-stats/get-users-stats');
        return response.data;
      } catch (error) {
        throw error.response?.data || {
          detail: 'An error occurred while fetching user statistics'
        };
      }
    },

    /**
     * Get interview statistics from dashboard stats
     * @returns {Promise}
     */
    getInterviewsStats: async () => {
      try {
        const response = await api.get('/dashboard-stats/get-interviews-stats');
        return response.data;
      } catch (error) {
        throw error.response?.data || {
          detail: 'An error occurred while fetching interview statistics'
        };
      }
    },
  saveViolation: async (interviewId, count) => {
    try {
      return await api.post(`/candidate/violations/${interviewId}`, {
        violation_count: count,
        event_type: "fullscreen_exit"
      });
    } catch (err) {
      console.error("Error saving violation:", err);
    }
  }

};

export default interviewService;
