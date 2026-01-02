import api from './api';

/**
 * Get users assigned to a job posting
 * @param {string} jobId - ID of the job posting
 * @returns {Promise<Array>} - List of assigned users
 */
export const getJobAssignments = async (jobId) => {
  try {
    // Fetch assignments from the job_assignments collection
    const response = await api.get(`/get-assigned-users-of-job/${jobId}`);
    return response.data.assigned_users || [];
  } catch (error) {
    console.error(`Error fetching job assignments:`, error);
    throw error;
  }
};

/**
 * Assign job to users
 * @param {string} jobId - ID of the job posting
 * @param {Array<string>} userIds - List of user IDs to assign the job to
 * @returns {Promise<Object>} - Response from the API
 */
export const assignJob = async (jobId, userIds) => {
  try {
    const response = await api.post(`/job-assignments/assign`, {
      job_id: jobId,
      user_ids: userIds
    });
    return response.data;
  } catch (error) {
    console.error(`Error assigning job:`, error);
    throw error;
  }
};

/**
 * Remove a user assigned to a job posting
 * @param {string} jobId - ID of the job posting
 * @param {string} userId - ID of the user to remove
 * @returns {Promise<Object>} - Response from the API
 */
export const removeAssignedUser = async (jobId, userId) => {
  try {
    const response = await api.delete(`/job-assignments/remove`, {
      data: {
        job_id: jobId,
        user_id: userId
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error removing assigned user:`, error);
    throw error;
  }
};

export default {
  getJobAssignments,
  assignJob,
  removeAssignedUser
};