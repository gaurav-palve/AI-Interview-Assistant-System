import axios from "axios";

const API_BASE = "http://localhost:8000/api/role-management";

const createRole = async ({ role_name, description, permissions = [] }) => {
  try {
    const token = localStorage.getItem("access_token");

    const response = await axios.post(
      `${API_BASE}/create-role`,
      { name: role_name, description, permissions },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("createRole error:", error);
    throw new Error(
      error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Failed to create role"
    );
  }
};

const getRoles = async () => {
  try {
    const token = localStorage.getItem("access_token");

    const response = await axios.get(`${API_BASE}/get-roles`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("getRoles error:", error);
    throw new Error(
      error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Failed to fetch roles"
    );
  }
};

/* 🔥 NEW API */
const getPermissions = async () => {
  try {
    const token = localStorage.getItem("access_token");

    const response = await axios.get(
      `${API_BASE}/get_permissions`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("getPermissions error:", error);
    throw new Error(
      error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Failed to fetch permissions"
    );
  }
};

/* Get a single role by ID */
const getRole = async (roleId) => {
  try {
    const token = localStorage.getItem("access_token");

    const response = await axios.get(
      `${API_BASE}/get-role/${roleId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("getRole error:", error);
    throw new Error(
      error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Failed to fetch role"
    );
  }
};

/* Update an existing role */
const updateRole = async (roleId, { name, description, is_active, permissions }) => {
  try {
    const token = localStorage.getItem("access_token");

    const response = await axios.put(
      `${API_BASE}/edit-role/${roleId}`,
      {
        name,
        description,
        is_active,
        permissions
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("updateRole error:", error);
    throw new Error(
      error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Failed to update role"
    );
  }
};

/* Delete a role */
const deleteRole = async (roleId) => {
  try {
    const token = localStorage.getItem("access_token");

    const response = await axios.delete(
      `${API_BASE}/delete-role/${roleId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("deleteRole error:", error);
    throw new Error(
      error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Failed to delete role"
    );
  }
};

export const RoleManagementService = {
  createRole,
  getRoles,
  getPermissions,
  getRole,
  updateRole,
  deleteRole,
};
