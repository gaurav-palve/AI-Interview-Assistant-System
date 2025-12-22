import api from "./api";

/**
 * ============================
 * User Management APIs
 * ============================
 */

/**
 * Create a new user
 * POST /users
 */
export const createUser = async (userData) => {
  try {
    const response = await api.post("/users/create", {
      first_name: userData.first_name,
      middle_name: userData.middle_name || null,
      last_name: userData.last_name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      role_id: userData.role_id,
      employee_id: userData.employee_id,
      department: userData.department,
      location: userData.location,
      reporting_manager: userData.reporting_manager,
    });

    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

/**
 * Update existing user
 * PUT /users/{user_id}
 */
export const updateUser = async (userId, userData) => {
  try {
    const payload = {};

    if ("first_name" in userData) payload.first_name = userData.first_name;
    if ("middle_name" in userData) payload.middle_name = userData.middle_name;
    if ("last_name" in userData) payload.last_name = userData.last_name;
    if ("phone" in userData) payload.phone = userData.phone;
    if ("password" in userData && userData.password)
      payload.password = userData.password;
    if ("role_id" in userData) payload.role_id = userData.role_id;

    const response = await api.put(`/users/${userId}`, payload);
    return response.data;
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    throw error;
  }
};

/**
 * Delete a user
 * DELETE /users/{user_id}
 */
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw error;
  }
};

/**
 * Fetch all users
 * GET /users
 */
export const fetchUsers = async () => {
  try {
    const response = await api.get("/users");
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

/**
 * Fetch single user by ID
 * GET /users/{user_id}
 */
export const fetchUserById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
};

export default {
  createUser,
  updateUser,
  deleteUser,
  fetchUsers,
  fetchUserById,
};
