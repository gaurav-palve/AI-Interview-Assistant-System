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
      const response = await api.post('/job-postings/create_job_posting', jobPostingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while creating job posting' };
    }
  },

  /**
   * Update an existing job posting (full update)
   * @param {string} id - Job posting ID
   * @param {Object} jobPostingData - Updated job posting data
   * @returns {Promise} - Promise with the updated job posting
   */
  updateJobPosting: async (id, jobPostingData) => {
    try {
      const response = await api.put(`/job-postings/update_job_posting/${id}`, jobPostingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while updating job posting' };
    }
  },

  /**
   * Update ONLY the job description safely
   * @param {string} id - Job posting ID
   * @param {string} jobDescription - New job description text
   * @returns {Promise} - Promise with the updated job posting
   */
  updateJobDescription: async (id, jobDescription) => {
    try {
      const response = await api.patch(`/job-postings/job-description/${id}`, {
        job_description: jobDescription
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while updating job description' };
    }
  },

  /**
   * Get all job postings with optional filters
   * @param {Object} filters - Optional filters (status, search, etc.)
   * @returns {Promise} - Promise with the list of job postings
   */
  getJobPostings: async (filters = {}) => {
    try {
      const response = await api.get('/job-postings/get_job_postings', { params: filters });
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
      const response = await api.get(`/job-postings/get_job_posting_by_id/${id}`);
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
      const response = await api.delete(`/job-postings/delete_job_posting/${id}`);
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
      console.log(`Changing job posting ${id} status to ${status}`);
      const response = await api.patch(`/job-postings/update-job-posting-status/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error in changeJobPostingStatus:', error);
      return { id, status, updated_at: new Date().toISOString(), mock: true };
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

      // Get job description file from job posting
      const jobPosting = await jobPostingService.getJobPosting(id);
      const jdFile = new Blob([jobPosting.job_description], { type: 'application/pdf' });
      formData.append('jd_file', jdFile, 'job_description.pdf');

      const response = await api.post('/screening/resume-screening', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        withCredentials: true,
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred during resume screening' };
    }
  },

  /**
   * ✅ Get statistics for a specific job posting
   * @param {string} id - Job posting ID
   * @returns {Promise} - Promise with the job posting statistics
   */
  getJobPostingStatistics: async (id) => {
    try {
      const response = await api.get(`/job-postings-stats/stats/job-posting/${id}`);
      return response.data.data; // Backend stats object
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while fetching job posting statistics' };
    }
  },
};

export default jobPostingService;
