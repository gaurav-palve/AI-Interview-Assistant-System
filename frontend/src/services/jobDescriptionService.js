import api from './api';

/**
 * Service for job description generation and management
 */
const jobDescriptionService = {
  /**
   * Generate a job description based on provided requirements
   * @param {Object} requirements - Job requirements
   * @param {string} requirements.company_description - Company description
   * @param {string} requirements.job_role - Job role/title
   * @param {string} requirements.location - Job location
   * @param {string} requirements.experience - Required experience
   * @param {string} requirements.qualifications - Required qualifications
   * @param {string} requirements.skills - Required skills
   * @returns {Promise} - Promise with the generated job description
   */
  generateJobDescription: async (requirements) => {
    try {
      const response = await api.post('/job-descriptions/generate', requirements);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while generating job description' };
    }
  },

  /**
   * Save a job description to the database
   * @param {Object} requirements - Job requirements
   * @param {string} requirements.company_description - Company description
   * @param {string} requirements.job_role - Job role/title
   * @param {string} requirements.location - Job location
   * @param {string} requirements.experience - Required experience
   * @param {string} requirements.qualifications - Required qualifications
   * @param {string} requirements.skills - Required skills
   * @param {string} generatedDescription - The generated job description text
   * @returns {Promise} - Promise with the saved job description
   */
  saveJobDescription: async (requirements) => {
    try {
      const response = await api.post('/job-descriptions/save', requirements);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while saving job description' };
    }
  },

  /**
   * Get all saved job descriptions
   * @returns {Promise} - Promise with the list of job descriptions
   */
  getJobDescriptions: async () => {
    try {
      const response = await api.get('/job-descriptions/list');
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while fetching job descriptions' };
    }
  },

  /**
   * Get a specific job description by ID
   * @param {string} id - Job description ID
   * @returns {Promise} - Promise with the job description
   */
  getJobDescription: async (id) => {
    try {
      const response = await api.get(`/job-descriptions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while fetching job description' };
    }
  },

  /**
   * Delete a job description
   * @param {string} id - Job description ID
   * @returns {Promise} - Promise with the delete result
   */
  deleteJobDescription: async (id) => {
    try {
      const response = await api.delete(`/job-descriptions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: 'An error occurred while deleting job description' };
    }
  }
};

export default jobDescriptionService;