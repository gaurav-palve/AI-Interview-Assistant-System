import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import userManagementService from "../services/userManagementService";
import { RoleManagementService } from "../services/roleManagementService";

import {
  Add as AddIcon,
  EditOutlined,
  DeleteOutline,
  PeopleOutlined,
  PersonOutline,
  PhoneOutlined,
  SecurityOutlined,
  WorkOutlined,
  LocationOnOutlined,
  CheckCircleOutline,
  MoreHorizOutlined,
  MoreVertOutlined,
} from "@mui/icons-material";

function UsersList() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rolesMap, setRolesMap] = useState({});

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await userManagementService.fetchUsers();
      setUsers(res || []);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

    useEffect(() => {
    const loadRoles = async () => {
        const res = await RoleManagementService.getRoles();
        const map = {};
        res.roles.forEach((r) => {
        map[r._id] = r.name || r.role_name;
        });
        setRolesMap(map);
    };

    loadRoles();
    }, []);


  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await userManagementService.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch {
      alert("Failed to delete user");
    }
  };

  return (
    <div className="w-full px-6 py-5 space-y-6">
      {/* ================= Page Header ================= */}
      <div className="flex justify-between items-center">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
          All Users
        </h1>

        <button
          onClick={() => navigate("/users/create")}
          className="flex items-center justify-center
                      w-[157px] h-[44px]
                      p-[10px]
                      gap-[6px]
                      text-sm
                      border border-[#CBD5E1]
                      rounded-lg bg-[#2563EB] text-[#FFFFFF]"
        >
          <AddIcon fontSize="small" className="mr-1" />
          Create User
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* ================= USER STATISTICS (VERTICAL) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <PeopleOutlined className="text-blue-600" />
            <p className="text-sm text-gray-500">Total Users</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 ml-8">{users.length}</p>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircleOutline className="text-green-600" />
            <p className="text-sm text-gray-500">Active Users</p>
          </div>
          <p className="text-2xl font-bold text-green-600 ml-8">
            {users.filter((u) => u.is_active).length}
          </p>
        </div>

        {/* Inactive Users */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <PersonOutline className="text-red-600" />
            <p className="text-sm text-gray-500">Inactive Users</p>
          </div>
          <p className="text-2xl font-bold text-red-600 ml-8">
            {users.filter((u) => !u.is_active).length}
          </p>
        </div>

        {/* New This Month */}
  <div className="bg-white rounded-xl shadow-sm p-5">
    <div className="flex items-center gap-2 mb-3">
      <AddIcon className="text-purple-600" />
      <p className="text-sm text-gray-500">New This Month</p>
    </div>
    <p className="text-2xl font-bold text-purple-600 ml-8">
      {users.filter((u) => {
        const created = new Date(u.created_at);
        const now = new Date();
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }).length}
    </p>
  </div>
</div>

      

      {/* ================= Users Table ================= */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* ===== Header Row ===== */}
        <div
          className="
            hidden md:grid
            grid-cols-[30%_12%_12%_12%_12%_10%_12%]
            px-5 py-3
            bg-gray-50
            text-xs font-semibold text-gray-500 uppercase
          "
        >
          <div className="flex items-center gap-1 justify-start pl-12">
            <PersonOutline fontSize="small" /> User
          </div>
          <div className="flex items-center justify-center gap-1">
            <PhoneOutlined fontSize="small" /> Phone
          </div>
          <div className="flex items-center justify-center gap-1">
            <SecurityOutlined fontSize="small" /> Role
          </div>
          <div className="flex items-center justify-center gap-1">
            <WorkOutlined fontSize="small" /> Department
          </div>
          <div className="flex items-center justify-center gap-1">
            <LocationOnOutlined fontSize="small" /> Location
          </div>
          <div className="flex items-center justify-center gap-1">
            <CheckCircleOutline fontSize="small" /> Status
          </div>
          <div className="flex items-center justify-center gap-1">
            <MoreVertOutlined fontSize="small" /> Action
          </div>
        </div>

        {/* ===== Body ===== */}
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No users found</div>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              className="
                grid grid-cols-[30%_12%_12%_12%_12%_10%_12%]
                px-5 py-4 border-t
                items-center
                hover:bg-gray-50 transition
              "
            >
              <div className="flex items-center gap-4 min-w-0 justify-start">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                  {user.first_name?.[0]}
                </div>
                <div className="min-w-0 text-left">
                  <p className="font-medium text-gray-900 leading-tight">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-sm text-gray-500 break-all">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="text-sm text-gray-600 text-center">
                {user.phone || "-"}
              </div>

              <div className="flex justify-center">
                <span className="px-3 py-1 rounded-full text-xs font-medium text-gray-600 text-left">
                  {rolesMap[user.role_id] || "-"}
                </span>
              </div>

              <div className="px-3 py-1 rounded-full text-xs font-medium text-gray-600 text-left">
                {user.department || "-"}
              </div>

              <div className="px-3 py-1 rounded-full text-xs font-medium text-gray-600 text-left">
                {user.location || "-"}
              </div>

              <div className="flex justify-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium text-left ${
                    user.is_active
                      ? "text-[#28A745]"
                      : "text-[#DC2626]"
                  }`}
                >
                  {user.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex justify-center gap-2">
                <button
                  onClick={() => navigate(`/users/${user._id}`)}
                  className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                >
                  <EditOutlined fontSize="small" />
                </button>
                <button
                  onClick={() => handleDelete(user._id)}
                  className="h-8 w-8 rounded-full border border-red-300 text-red-600 flex items-center justify-center hover:bg-red-50"
                >
                  <DeleteOutline fontSize="small" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UsersList;








