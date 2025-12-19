
import { Shield, X } from "lucide-react";
import { RoleManagementService } from "../../services/roleManagementService";
import { useEffect, useState } from "react";


const handleCreateRole = async (e) => {
  e.preventDefault();
  setLoadingCreate(true);
  setError("");
  setSuccessMessage("");

  try {
    const data = await RoleManagementService.createRole({
      role_name: roleName,
      description,
    });

    setSuccessMessage(data.message || "Role created successfully");

    setRoleName("");
    setDescription("");
    setSelectedPermissions([]);

    // Optional: refresh roles properly later
  } catch (err) {
    setError(err.message || "Failed to create role");
  } finally {
    setLoadingCreate(false);
  }
};



const RoleManagement = () => {
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);

  // Form state for create role
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch state for roles
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Temporary state for permissions (UI only)
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const allPermissions = [
    { id: "ROLE_MANAGE", name: "Role Management", category: "Admin" },
    { id: "USER_CREATE", name: "Create Users", category: "Admin" },
    { id: "USER_EDIT", name: "Edit Users", category: "Admin" },
    { id: "USER_DELETE", name: "Delete Users", category: "Admin" },
    { id: "JOB_VIEW_ALL", name: "View All Jobs", category: "Jobs" },
    { id: "JOB_VIEW", name: "View Jobs", category: "Jobs" },
    { id: "JOB_CREATE", name: "Create Jobs", category: "Jobs" },
    { id: "JOB_EDIT", name: "Edit Jobs", category: "Jobs" },
    { id: "JOB_DELETE", name: "Delete Jobs", category: "Jobs" },
    { id: "RESUME_UPLOAD", name: "Upload Resume", category: "Resumes" },
    { id: "RESUME_VIEW", name: "View Resumes", category: "Resumes" },
    { id: "RESUME_VIEW_ALL", name: "View All Resumes", category: "Resumes" },
    { id: "RESUME_DOWNLOAD", name: "Download Resumes", category: "Resumes" },
    { id: "DUPLICATE_VIEW", name: "View Duplicates", category: "Resumes" },
    { id: "INTERVIEW_SCHEDULE", name: "Schedule Interview", category: "Interviews" },
    { id: "INTERVIEW_VIEW", name: "View Interviews", category: "Interviews" },
    { id: "INTERVIEW_VIEW_ALL", name: "View All Interviews", category: "Interviews" },
    { id: "CANDIDATE_VIEW", name: "View Candidates", category: "Candidates" },
    { id: "REPORT_VIEW", name: "View Reports", category: "Reports" }
  ];

  // Fetch roles from backend
  useEffect(() => {
  const fetchRoles = async () => {
    setLoadingRoles(true);
    setFetchError("");

    try {
      const data = await RoleManagementService.getRoles();

      if (data.status === "success") {
        const mappedRoles = data.roles.map((role) => ({
          id: role._id,
          name: role.role_name,
          description: role.description,
          permissions: role.permissions || [],
          users: role.users || 0,
          createdDate: role.created_at,
          status: role.status || "Active",
        }));

        setRoles(mappedRoles);
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setLoadingRoles(false);
    }
  };

  fetchRoles();
}, []);


  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setLoadingCreate(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch('http://localhost:8000/api/role-management/create-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roleName,
          description: description,
          // permissions: selectedPermissions, // Uncomment when backend supports it
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create role');
      }

      const data = await response.json();
      setSuccessMessage(data.message || 'Role created successfully!');

      // Reset form
      setRoleName('');
      setDescription('');
      setSelectedPermissions([]);

      // Refresh roles list
      setRoles(prev => [...prev, {
        id: Date.now(), // temporary until refetch
        name: roleName,
        description,
        permissions: [],
        users: 0,
        createdDate: new Date().toISOString().split('T')[0],
        status: 'Active'
      }]);

      // Auto-close modal after success
      setTimeout(() => {
        setShowCreateRoleModal(false);
        setSuccessMessage('');
      }, );

    } catch (err) {
      console.error('Error creating role:', err);
      setError(err.message || 'Failed to create role. Please try again.');
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateRoleModal(false);
    setRoleName('');
    setDescription('');
    setSelectedPermissions([]);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Role Management</h2>
            <p className="text-gray-600 mt-1">Manage roles and permissions across the system</p>
          </div>
          <button 
            onClick={() => setShowCreateRoleModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
          >
            <Shield size={20} />
            Create New Role
          </button>
        </div>

        {/* Loading or Error State for Roles */}
        {loadingRoles && (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading roles...</p>
          </div>
        )}

        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700 font-medium">{fetchError}</p>
          </div>
        )}

        {/* Role Cards Grid */}
        {!loadingRoles && !fetchError && roles.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-600">No roles found. Create your first role!</p>
          </div>
        )}

        {!loadingRoles && !fetchError && roles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {roles.map(role => (
              <div key={role.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Shield className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{role.name}</h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        role.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {role.status}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{role.description}</p>

                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Shield size={16} />
                    <span>{role.users} users</span>
                  </div>
                  <div className="text-gray-500 text-xs">
                    Created: {new Date(role.createdDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">PERMISSIONS ({role.permissions.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((perm, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                        {perm}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{role.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium">
                    Edit Role
                  </button>
                  <button className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-medium">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Permissions Matrix Table */}
        {!loadingRoles && !fetchError && roles.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Permissions Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Permission</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Category</th>
                    {roles.filter(r => r.status === 'Active').map(role => (
                      <th key={role.id} className="text-center py-3 px-4 text-sm font-semibold text-gray-600">
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allPermissions.map((perm, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">{perm.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded font-medium">
                          {perm.category}
                        </span>
                      </td>
                      {roles.filter(r => r.status === 'Active').map(role => (
                        <td key={role.id} className="py-3 px-4 text-center">
                          {role.permissions.includes(perm.id) ? (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-6 h-6 bg-gray-200 rounded-full mx-auto"></div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Role Modal */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Create New Role</h3>
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateRole}>
              <div className="p-6 space-y-4">
                {successMessage && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm font-medium">{successMessage}</p>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g., Senior Recruiter" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    required
                    disabled={loadingCreate}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    placeholder="Brief description of this role" 
                    rows="3" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    disabled={loadingCreate}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Permissions <span className="text-xs text-gray-500">(Coming soon)</span>
                  </label>
                  <div className="space-y-4">
                    {['Admin', 'Jobs', 'Resumes', 'Interviews', 'Candidates', 'Reports'].map(category => (
                      <div key={category} className="border border-gray-200 rounded-lg p-4 bg-gray-50 opacity-60">
                        <h4 className="font-semibold text-gray-800 mb-3">{category}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {allPermissions.filter(p => p.category === category).map(perm => (
                            <label key={perm.id} className="flex items-center gap-2 cursor-not-allowed">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                checked={selectedPermissions.includes(perm.id)}
                                onChange={() => handlePermissionToggle(perm.id)}
                                disabled
                              />
                              <span className="text-sm text-gray-700">{perm.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * Permission assignment will be available in the next update
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3 justify-end bg-gray-50">
                <button 
                  onClick={handleCloseModal} 
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  disabled={loadingCreate}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loadingCreate}
                >
                  {loadingCreate ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;