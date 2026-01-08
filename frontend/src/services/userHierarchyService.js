import api from './api';

/**
 * Service for fetching user hierarchy data
 */
const userHierarchyService = {
  /**
   * Get user hierarchy data
   * @returns {Promise} Promise object with user hierarchy data
   */
  getUserHierarchy: async () => {
    try {
      const response = await api.get('/user-management/user-hierarchy');
      
      // Ensure we always return an array
      if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.error('Expected array but got:', typeof response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching user hierarchy:', error);
      throw error;
    }
  }
};

export default userHierarchyService;