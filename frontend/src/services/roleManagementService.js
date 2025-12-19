import axios from "axios";

const API_BASE = "http://localhost:8000/api/role-management";

const createRole = async ({ role_name, description }) => {
  try {
    const token = localStorage.getItem("access_token");

    const response = await axios.post(
      `${API_BASE}/create-role`,
      { name: role_name, description },
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

export const RoleManagementService = {
  createRole,
  getRoles,
};
