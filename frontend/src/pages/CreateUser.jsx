import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import userManagementService from "../services/userManagementService";
import { RoleManagementService } from "../services/roleManagementService";
import authService from "../services/authService";
import { Autocomplete, TextField } from "@mui/material";


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
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

/* ================= Validation Regex ================= */
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]{1,49}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  error,
}) {
  // Add state for password visibility (only for password fields)
  const [showPassword, setShowPassword] = useState(false);
  
  // Determine the actual input type
  const inputType = type === "password" ? (showPassword ? "text" : "password") : type;
  
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative mt-1">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
        )}
        <input
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={name}
          className={`w-full h-10 rounded-lg border text-sm px-3 ${
            Icon ? "pl-10" : ""
          } ${type === "password" ? "pr-10" : ""} ${error ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
        
        {/* Add eye button for password fields */}
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <VisibilityOff className="h-5 w-5" /> : <Visibility className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
const DEPARTMENTS = [
  "HR & Administration",
  "Innovation and AI",
  "Sales",
  "Marketing",
  "Application Development",
  "Talent Acquisition",
  "Quality Assurance",
  "Devops",
  "Others"
];
const MAX_VISIBLE = 3;
function CreateUser() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const isEdit = Boolean(userId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    hashed_password: "",
    employee_id: "",
    department: "",
    location: "",
    reporting_manager: "",
    role_id: "",
    assignable_role_ids: [],
  });

  /* ================= Load User (Edit) ================= */
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
          hashed_password: "",
          employee_id: res.employee_id || "",
          department: res.department || "",
          location: res.location || "",
          reporting_manager: res.reporting_manager || "",
          role_id: res.role_id || "",
          assignable_role_ids: res.assignable_role_ids || [],
        });
      } catch {
        setError("Failed to load user");
      }
    };

    loadUser();
  }, [userId, isEdit]);

  /* ================= Load Users & Roles ================= */
  useEffect(() => {
    const loadMeta = async () => {
      try {
        // Check if current user is a superadmin
        const userRole = await authService.getUserRole();
        setIsSuperAdmin(userRole === "SUPER_ADMIN");

        const [usersRes, rolesRes] = await Promise.all([
          userManagementService.fetchUsers(),
          RoleManagementService.getRoles(),
        ]);

        setUsers(usersRes);
        setRoles(rolesRes.roles);
      } catch {
        setError("Failed to load users / roles");
      }
    };

    loadMeta();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  // Handle checkbox changes for delegatable roles
  const handleDelegatableRoleChange = (roleId) => {
    setFormData((prev) => {
      // Check if the role is already in the array
      const isSelected = prev.assignable_role_ids.includes(roleId);
      
      // If selected, remove it; otherwise, add it
      const updatedRoles = isSelected
        ? prev.assignable_role_ids.filter(id => id !== roleId)
        : [...prev.assignable_role_ids, roleId];
      
      return {
        ...prev,
        assignable_role_ids: updatedRoles
      };
    });
  };

  /* ================= Validation ================= */
  const validateForm = () => {
    const newErrors = {};

    if (!NAME_REGEX.test(formData.first_name))
      newErrors.first_name = "Enter valid first name";

    if (formData.middle_name && !NAME_REGEX.test(formData.middle_name))
      newErrors.middle_name = "Invalid middle name";

    if (!NAME_REGEX.test(formData.last_name))
      newErrors.last_name = "Enter valid last name";

    if (!EMAIL_REGEX.test(formData.email))
      newErrors.email = "Enter valid email";

    if (!PHONE_REGEX.test(formData.phone))
      newErrors.phone = "Enter valid phone number";

    if (!isEdit && formData.hashed_password.length < 8)
      newErrors.hashed_password = "Minimum 8 characters required";

    if (!formData.department.trim())
      newErrors.department = "Department required";

    if (!formData.location.trim())
      newErrors.location = "Location required";

    if (!formData.reporting_manager)
      newErrors.reporting_manager = "Reporting manager required";

    if (!formData.role_id)
      newErrors.role_id = "Select a role";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

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
    <div className="w-full px-2 sm:px-6 md:px-2">
      {/* ================= Header ================= */}
      <div className="border-b border-gray-300 pb-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="flex">
              <div className="border-r border-black pr-3">
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                  {isEdit ? "Update User" : "Create User"}
                </h1>
              </div>
              <div className="pl-2 max-w-[300px]">
                <p className="text-gray-600 mt-1">
                  Add a new user and assign roles & permissions
                </p>
              </div>
            </span>

            <button
              onClick={() => navigate("/users")}
              className="flex items-center justify-center
                      w-[120px] h-[44px]
                      p-[10px]
                      gap-[6px]
                      text-sm
                      border border-[#CBD5E1]
                      rounded-lg bg-[#2563EB] text-[#FFFFFF]"
            >
              <BackIcon className="h-3 w-3 mr-1" />
              Back
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto py-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto py-8 space-y-6">
        {/* ================= Basic Information ================= */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <PersonOutlined className="text-gray-500" />
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="First Name *" name="first_name" icon={PersonOutlined} value={formData.first_name} onChange={handleChange} error={errors.first_name} />
            <Input label="Middle Name" name="middle_name" icon={PersonOutlined} value={formData.middle_name} onChange={handleChange} error={errors.middle_name} />
            <Input label="Last Name *" name="last_name" icon={PersonOutlined} value={formData.last_name} onChange={handleChange} error={errors.last_name} />
            <Input label="Email *" name="email" icon={EmailOutlined} type="email" disabled={isEdit} value={formData.email} onChange={handleChange} error={errors.email} />
            <Input label="Phone *" name="phone" icon={PhoneOutlined} value={formData.phone} onChange={handleChange} error={errors.phone} />
            <Input label="Temporary Password *" name="hashed_password" icon={LockOutlined} type="password" value={formData.hashed_password} onChange={handleChange} error={errors.hashed_password} />
            <Input label="Employee ID" name="employee_id" icon={BadgeOutlined} value={formData.employee_id} onChange={handleChange} />
          </div>
        </section>

        {/* ================= Work Information ================= */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <WorkOutline className="text-gray-500" />
            Work Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Department *
              </label>

              <Autocomplete
                freeSolo
                options={DEPARTMENTS}
                value={formData.department}
                onChange={(e, newValue) => {
                  setFormData(prev => ({
                    ...prev,
                    department: newValue || ""
                  }));
                  setErrors(prev => ({ ...prev, department: "" }));
                }}
                onInputChange={(e, newInputValue) => {
                  setFormData(prev => ({
                    ...prev,
                    department: newInputValue
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select or type department"
                    error={Boolean(errors.department)}
                    helperText={errors.department}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <BusinessOutlined
                            style={{ marginRight: 8, color: "#9CA3AF" }}
                          />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "40px",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem"
                      }
                    }}
                  />
                )}
              />
            </div>

            <Input label="Location *" name="location" icon={LocationOnOutlined} value={formData.location} onChange={handleChange} error={errors.location} />

            <div>
              <label className="text-sm font-medium text-gray-700">Reporting Manager *</label>
              <div className="relative mt-1">
                <SupervisorAccountOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  name="reporting_manager"
                  value={formData.reporting_manager}
                  onChange={handleChange}
                  className="w-full h-10 rounded-lg border border-gray-300 text-sm pl-10 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Manager</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.first_name} {u.last_name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.reporting_manager && (
                <p className="text-xs text-red-600 mt-1">{errors.reporting_manager}</p>
              )}
            </div>
          </div>
        </section>

        {/* ================= Roles ================= */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <SecurityOutlined className="text-gray-500" />
            Roles & Permissions *
          </h2>

          {errors.role_id && <p className="text-xs text-red-600">{errors.role_id}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((r) => (
              <label
                key={r._id}
                className={`flex gap-3 p-4 border rounded-lg cursor-pointer transition ${
                  formData.role_id === r._id
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-400"
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

                <div className="w-full">
                  <p className="text-sm font-medium text-gray-900">
                    {r.name || r.role_name}
                  </p>

                  {/* Permission Chips */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {r.permissions?.slice(0, MAX_VISIBLE).map((perm, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg"
                      >
                        {perm}
                      </span>
                    ))}

                    {r.permissions?.length > MAX_VISIBLE && (
                      <div className="relative group">
                        <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg cursor-pointer">
                          +{r.permissions.length - MAX_VISIBLE} more
                        </span>

                        {/* Tooltip */}
                        <div className="absolute z-50 hidden group-hover:block 
                                        bg-red text-gray-700 text-xs rounded-lg 
                                        px-2 py-1 bottom-full left-1/2 
                                        -translate-x-1/2 mb-2 shadow-lg">

                          <div className="flex flex-wrap gap-1">
                            {r.permissions.slice(MAX_VISIBLE).map((perm, i) => (
                              <span
                                key={i}
                                className="bg-gray-100 px-2 py-1 rounded-lg"
                              >
                                {perm}
                              </span>
                            ))}
                          </div>
                          
                          {/* Arrow */}
                          <div className="absolute w-2 h-2 bg-black rotate-45 
                                          left-1/2 -translate-x-1/2 -bottom-1"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Assignable Roles Section - Only show for superadmins after a primary role is selected */}
          {formData.role_id && !isEdit && isSuperAdmin && (
            <div className="col-span-full mt-6 border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <SecurityOutlined className="h-4 w-4 mr-2 text-gray-500" />
                Sub-User Role Assignment / Allowed Role Assignments (Optional)
              </h3>
              <p className="text-xs text-blue-500 mb-3">
                Select roles that this user can assign to their sub-users. Leave empty if the user should not be able to delegate roles.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {roles.map((role) => (
                  <label
                    key={`delegatable-${role._id}`}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                      formData.assignable_role_ids.includes(role._id)
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignable_role_ids.includes(role._id)}
                      onChange={() => handleDelegatableRoleChange(role._id)}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {role.name || role.role_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Allow this user to assign the {role.name || role.role_name} role to their sub-users
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ================= Action ================= */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center px-6 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 "
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : isEdit ? "Update User" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateUser;
