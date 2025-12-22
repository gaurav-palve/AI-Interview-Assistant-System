import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import userManagementService from "../services/userManagementService";
import { RoleManagementService } from "../services/roleManagementService";

import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  PersonOutlined,
  EmailOutlined,
  PhoneOutlined,
  LockOutlined,
  SecurityOutlined,
  WorkOutline,
  BadgeOutlined,
  BusinessOutlined,
  LocationOnOutlined,
  SupervisorAccountOutlined,
} from "@mui/icons-material";

/* ================= Reusable Input ================= */
function Input({
  label,
  name,
  icon: Icon,
  type = "text",
  disabled,
  placeholder,
  value,
  onChange,
}) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        )}
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`form-input ${Icon ? "pl-10" : ""}`}
        />
      </div>
    </div>
  );
}

function CreateUser() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const isEdit = Boolean(userId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ✅ NEW STATES */
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    employee_id: "",
    department: "",
    location: "",
    reporting_manager: "",
    role_id: "",
  });

  /* ================= Load user (Edit) ================= */
  useEffect(() => {
    if (!isEdit) return;

    const loadUser = async () => {
      try {
        const res = await userManagementService.fetchUserById(userId);
        setFormData({
          first_name: res.first_name || "",
          middle_name: res.middle_name || "",
          last_name: res.last_name || "",
          email: res.email || "",
          phone: res.phone || "",
          password: "",
          employee_id: res.employee_id || "",
          department: res.department || "",
          location: res.location || "",
          reporting_manager: res.reporting_manager || "",
          role_id: res.role_id || "",
        });
      } catch {
        setError("Failed to load user");
      }
    };

    loadUser();
  }, [userId, isEdit]);

  /* ================= Load users + roles ================= */
  useEffect(() => {
  const loadMeta = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        userManagementService.fetchUsers(),
        RoleManagementService.getRoles(),
      ]);

      setUsers(usersRes);
      setRoles(rolesRes.roles); // ✅ FIX HERE
    } catch (err) {
      console.error(err);
      setError("Failed to load users / roles");
    }
  };

  loadMeta();
}, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      isEdit
        ? await userManagementService.updateUser(userId, formData)
        : await userManagementService.createUser(formData);

      navigate("/users");
    } catch (err) {
      setError(err?.response?.data?.detail || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* ================= Header ================= */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? "Update User" : "Create New User"}
          </h1>
          <p className="text-gray-500 mt-1">
            Add a new user and assign roles & permissions
          </p>
        </div>

        <button onClick={() => navigate("/users")} className="btn btn-outline">
          <BackIcon fontSize="small" className="mr-1" />
          Back
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* ================= Basic Information ================= */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="flex items-center gap-3 text-base font-semibold">
          <span className="w-7 h-7 rounded-md bg-primary-100 flex items-center justify-center">
            <PersonOutlined fontSize="small" className="text-primary-600" />
          </span>
          Basic Information
        </h2>

        <div className="space-y-4">
          <Input label="First Name *" name="first_name" icon={PersonOutlined} value={formData.first_name} onChange={handleChange} />
          <Input label="Middle Name" name="middle_name" icon={PersonOutlined} value={formData.middle_name} onChange={handleChange} />
          <Input label="Last Name *" name="last_name" icon={PersonOutlined} value={formData.last_name} onChange={handleChange} />
          <Input label="Email Address *" name="email" icon={EmailOutlined} type="email" disabled={isEdit} value={formData.email} onChange={handleChange} />
          <Input label="Phone Number *" name="phone" icon={PhoneOutlined} value={formData.phone} onChange={handleChange} />
          <Input label="Temporary Password *" name="password" icon={LockOutlined} type="password" value={formData.password} onChange={handleChange} />
          <Input label="Employee ID" name="employee_id" icon={BadgeOutlined} value={formData.employee_id} onChange={handleChange} />
        </div>
      </section>

      {/* ================= Work Information ================= */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="flex items-center gap-3 text-base font-semibold">
          <span className="w-7 h-7 rounded-md bg-primary-100 flex items-center justify-center">
            <WorkOutline fontSize="small" className="text-primary-600" />
          </span>
          Work Information
        </h2>

        <div className="space-y-4">
          <Input label="Department" name="department" icon={BusinessOutlined} value={formData.department} onChange={handleChange} />
          <Input label="Location" name="location" icon={LocationOnOutlined} value={formData.location} onChange={handleChange} />

          {/* ✅ Reporting Manager Dropdown */}
          <div>
            <label className="form-label">Reporting Manager</label>
            <div className="relative">
              <SupervisorAccountOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                name="reporting_manager"
                value={formData.reporting_manager}
                onChange={handleChange}
                className="form-input pl-10"
              >
                <option value="">Select Manager</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.first_name} {u.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Roles & Permissions ================= */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="flex items-center gap-3 text-base font-semibold">
          <span className="w-7 h-7 rounded-md bg-primary-100 flex items-center justify-center">
            <SecurityOutlined fontSize="small" className="text-primary-600" />
          </span>
          Roles & Permissions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r) => (
            <label
              key={r._id}
              className={`flex gap-3 border rounded-lg p-4 cursor-pointer ${
                formData.role_id === r._id
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="role_id"
                value={r._id}
                checked={formData.role_id === r._id}
                onChange={handleChange}
                className="mt-1"
              />
              <div>
                {/* <p className="font-medium">{r.name}</p>
                <p className="text-xs text-gray-500">
                  {r.permissions?.length || 0} permissions
                </p> */}

                      <p className="font-medium">
                          {r.name || r.role_name}
                      </p>
                      <p className="text-xs text-gray-500">
                          {Array.isArray(r.permissions)
                              ? `${r.permissions.length} permissions`
                              : "No permissions assigned"}
                      </p>


              </div>
            </label>
          ))}
        </div>
      </section>

      {/* ================= Actions ================= */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn bg-primary-600 text-white px-6 py-2.5"
        >
          <SaveIcon fontSize="small" className="mr-1" />
          {loading ? "Saving..." : isEdit ? "Update User" : "Create User"}
        </button>
      </div>
    </div>
  );
}

export default CreateUser;
