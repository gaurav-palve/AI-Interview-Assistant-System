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
    const response = await api.post("/user-management/create", {
      first_name: userData.first_name,
      middle_name: userData.middle_name || null,
      last_name: userData.last_name,
      email: userData.email,
      phone: userData.phone,
      hashed_password: userData.hashed_password,
      role_id: userData.role_id,
      assignable_role_ids: userData.assignable_role_ids,
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
    if ("middle_name" in userData)
      payload.middle_name = userData.middle_name || null;
    if ("last_name" in userData) payload.last_name = userData.last_name;
    if ("phone" in userData) payload.phone = userData.phone;

    if ("hashed_password" in userData && userData.hashed_password) {
      payload.hashed_password = userData.hashed_password;
    }

    if ("role_id" in userData) payload.role_id = userData.role_id;
    if ("employee_id" in userData) payload.employee_id = userData.employee_id;
    if ("department" in userData) payload.department = userData.department;
    if ("location" in userData) payload.location = userData.location;
    if ("reporting_manager" in userData)
      payload.reporting_manager = userData.reporting_manager;

    const response = await api.put(`/user-management/update/${userId}`, payload);
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
    const response = await api.delete(`/user-management/delete/${userId}`);
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
    const response = await api.get("/user-management/get-all-users");
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
    const response = await api.get(`/user-management/get-user-by-id/${userId}`);
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
