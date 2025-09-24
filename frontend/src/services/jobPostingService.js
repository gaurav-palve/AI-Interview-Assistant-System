import api from './api';

/**
 * Service for job posting management
 */
const jobPostingService = {
  /**
   * Create a new job posting
   * @param {Object} jobPostingData - Job posting data
   * @returns {Promise} - Promise with the created job posting
   */
  createJobPosting: async (jobPostingData) => {
    try {
      const response = await api.post('/job-postings', jobPostingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while creating job posting' };
    }
  },

  /**
   * Update an existing job posting
   * @param {string} id - Job posting ID
   * @param {Object} jobPostingData - Updated job posting data
   * @returns {Promise} - Promise with the updated job posting
   */
  updateJobPosting: async (id, jobPostingData) => {
    try {
      const response = await api.put(`/job-postings/${id}`, jobPostingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while updating job posting' };
    }
  },

  /**
   * Get all job postings with optional filters
   * @param {Object} filters - Optional filters (status, search, etc.)
   * @returns {Promise} - Promise with the list of job postings
   */
  getJobPostings: async (filters = {}) => {
    try {
      const response = await api.get('/job-postings', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while fetching job postings' };
    }
  },

  /**
   * Get a specific job posting by ID
   * @param {string} id - Job posting ID
   * @returns {Promise} - Promise with the job posting
   */
  getJobPosting: async (id) => {
    try {
      const response = await api.get(`/job-postings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while fetching job posting' };
    }
  },

  /**
   * Delete a job posting
   * @param {string} id - Job posting ID
   * @returns {Promise} - Promise with the delete result
   */
  deleteJobPosting: async (id) => {
    try {
      const response = await api.delete(`/job-postings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while deleting job posting' };
    }
  },

  /**
   * Change the status of a job posting
   * @param {string} id - Job posting ID
   * @param {string} status - New status (active, draft, closed, archived)
   * @returns {Promise} - Promise with the updated job posting
   */
  changeJobPostingStatus: async (id, status) => {
    try {
      const response = await api.patch(`/job-postings/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while changing job posting status' };
    }
  },

  /**
   * Generate a job description using AI
   * @param {Object} jobData - Job data for AI generation
   * @returns {Promise} - Promise with the generated job description
   */
  generateJobDescription: async (jobData) => {
    try {
      const response = await api.post('/job-postings/generate-description', jobData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while generating job description' };
    }
  },

  /**
   * Screen resumes for a job posting
   * @param {string} id - Job posting ID
   * @param {File} resumesZipFile - Zip file containing resumes
   * @returns {Promise} - Promise with the screening results
   */
  screenResumes: async (id, resumesZipFile) => {
    try {
      const formData = new FormData();
      formData.append('zip_file', resumesZipFile);
      
      // Get the job description file from the job posting
      const jobPosting = await jobPostingService.getJobPosting(id);
      const jdFile = new Blob([jobPosting.job_description], { type: 'application/pdf' });
      formData.append('jd_file', jdFile, 'job_description.pdf');
      
      const response = await api.post('/resume-screening', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred during resume screening' };
    }
  }
};

export default jobPostingService;