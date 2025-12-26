import api from './api';

// Service for handling job statistics API calls
const jobStatisticsService = {
  /**
   * Get job statistics for dashboard
   * @returns {Promise<Object>} Job statistics response
   */
  getJobStatistics: async () => {
    try {
      const response = await api.get('jobwise-statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching job statistics:', error);
      throw error;
    }
  }
};

export default jobStatisticsService;