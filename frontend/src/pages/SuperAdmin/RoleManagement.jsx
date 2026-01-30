
import { Shield, X, Trash2 } from "lucide-react";
import AddIcon from "@mui/icons-material/Add";
import { RoleManagementService } from "../../services/roleManagementService";
import { useEffect, useState } from "react";



const RoleManagement = () => {
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [viewingRole, setViewingRole] = useState(null);
  const [deletingRole, setDeletingRole] = useState(null);

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
  const [permissions, setPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  useEffect(() => {
  const fetchPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const data = await RoleManagementService.getPermissions();

      if (data.status === "success") {
        // Sort permissions by module
        const sortedPermissions = [...data.permissions].sort((a, b) =>
          a.module.localeCompare(b.module) || a.code.localeCompare(b.code)
        );
        setPermissions(sortedPermissions);
      } else {
        throw new Error("Invalid permissions response");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPermissions(false);
    }
  };

  fetchPermissions();
}, []);

  


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
          permissions: selectedPermissions,
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

      // Immediately refetch roles instead of adding with temporary ID
      try {
        const rolesData = await RoleManagementService.getRoles();
        if (rolesData.status === "success") {
          const mappedRoles = rolesData.roles.map((role) => ({
            id: role._id,
            name: role.role_name,
            description: role.description,
            permissions: role.permissions || [],
            users: role.users || 0,
            createdDate: role.created_at,
            status: role.status || "Active",
          }));
          setRoles(mappedRoles);
        }
      } catch (fetchErr) {
        console.error('Error fetching updated roles:', fetchErr);
      }

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

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setDescription(role.description);
    setSelectedPermissions(role.permissions || []);
    setShowEditRoleModal(true);
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    setLoadingCreate(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await RoleManagementService.updateRole(
        editingRole.id,
        {
          name: roleName,
          description,
          permissions: selectedPermissions,
        }
      );

      setSuccessMessage(result.message || 'Role updated successfully!');

      // Update the role in the roles list
      setRoles(prev => prev.map(role =>
        role.id === editingRole.id
          ? {
              ...role,
              name: roleName,
              description,
              permissions: selectedPermissions,
            }
          : role
      ));

      // Auto-close modal after success
      setTimeout(() => {
        setShowEditRoleModal(false);
        setEditingRole(null);
        setRoleName('');
        setDescription('');
        setSelectedPermissions([]);
        setSuccessMessage('');
      }, );

    } catch (err) {
      console.error('Error updating role:', err);
      setError(err.message || 'Failed to update role. Please try again.');
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleCloseModal = () => {
    if (showCreateRoleModal) {
      setShowCreateRoleModal(false);
    }
    if (showEditRoleModal) {
      setShowEditRoleModal(false);
      setEditingRole(null);
    }
    if (showViewDetailsModal) {
      setShowViewDetailsModal(false);
      setViewingRole(null);
    }
    if (showDeleteConfirmModal) {
      setShowDeleteConfirmModal(false);
      setDeletingRole(null);
    }
    setRoleName('');
    setDescription('');
    setSelectedPermissions([]);
    setError('');
    setSuccessMessage('');
  };

  const handleViewDetails = async (role) => {
    try {
      setViewingRole(role);
      setShowViewDetailsModal(true);
      setError('');
      
      // Check if the ID is a valid MongoDB ObjectId (24-character hex string)
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(role.id);
      
      if (!isValidObjectId) {
        // If not valid, show a message but still display available details
        setError('Please refresh the page to view complete details for this newly created role.');
        return;
      }
      
      // Fetch the complete role details
      const result = await RoleManagementService.getRole(role.id);
      if (result.status === "success") {
        // Update the viewing role with complete details
        setViewingRole({
          ...role,
          fullDetails: result.role
        });
      }
    } catch (err) {
      console.error('Error fetching role details:', err);
      setError(err.message || 'Failed to fetch role details');
    }
  };

  const handleDeleteRole = (role) => {
    setDeletingRole(role);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteRole = async () => {
    if (!deletingRole) return;
    
    setLoadingCreate(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await RoleManagementService.deleteRole(deletingRole.id);
      
      setSuccessMessage(result.message || 'Role deleted successfully!');
      
      // Remove the role from the roles list
      setRoles(prev => prev.filter(role => role.id !== deletingRole.id));
      
      // Auto-close modal after success
      setTimeout(() => {
        setShowDeleteConfirmModal(false);
        setDeletingRole(null);
        setSuccessMessage('');
      }, );
      
    } catch (err) {
      console.error('Error deleting role:', err);
      setError(err.message || 'Failed to delete role. Please try again.');
    } finally {
      setLoadingCreate(false);
    }
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
            className="flex items-center justify-center
                      w-[180px] h-[44px]
                      p-[10px]
                      gap-[6px]
                      text-sm
                      border border-[#CBD5E1]
                      rounded-lg bg-[#2563EB] text-[#FFFFFF]"
          >
            <AddIcon fontSize="small" className="mr-1" />
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
                  <button
                    onClick={() => handleEditRole(role)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
                  >
                    Edit Role
                  </button>
                  <button
                    onClick={() => handleViewDetails(role)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-medium"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role)}
                    className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium flex items-center justify-center gap-1"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
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
                  {permissions.map((perm, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">{perm.description || perm.code}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded font-medium">
                          {perm.module}
                        </span>
                      </td>
                      {roles.filter(r => r.status === 'Active').map(role => (
                        <td key={role.id} className="py-3 px-4 text-center">
                          {role.permissions.includes(perm.code) ? (
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

      {/* Delete Role Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Delete Role</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

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

              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">Are you sure?</h4>
                <p className="text-gray-600 mb-4">
                  You are about to delete the role <span className="font-semibold">{deletingRole?.name}</span>.
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                  disabled={loadingCreate}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteRole}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-1"
                  disabled={loadingCreate}
                >
                  <Trash2 size={16} />
                  {loadingCreate ? 'Deleting...' : 'Delete Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    Select Permissions 
                  </label>
                  {loadingPermissions ? (
                    <div className="text-center py-4">
                      <p className="text-gray-600">Loading permissions...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Extract unique module values from permissions */}
                      {[...new Set(permissions.map(p => p.module))].map(category => (
                        <div key={category} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h4 className="font-semibold text-gray-800 mb-3">{category}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {permissions
                              .filter(p => p.module === category)
                              .map(perm => (
                                <label key={perm.code} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedPermissions.includes(perm.code)}
                                    onChange={() => handlePermissionToggle(perm.code)}
                                  />
                                  <span className="text-sm text-gray-700">
                                    {perm.description || perm.code}
                                  </span>
                                </label>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                 
                 <p className="text-xs text-gray-500 mt-2">
                   * Select permissions to assign to this role
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

      {/* Edit Role Modal */}
      {showEditRoleModal && editingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Edit Role</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateRole}>
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
                    Select Permissions
                  </label>
                  {loadingPermissions ? (
                    <div className="text-center py-4">
                      <p className="text-gray-600">Loading permissions...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Extract unique module values from permissions */}
                      {[...new Set(permissions.map(p => p.module))].map(category => (
                        <div key={category} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h4 className="font-semibold text-gray-800 mb-3">{category}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {permissions
                              .filter(p => p.module === category)
                              .map(perm => (
                                <label key={perm.code} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedPermissions.includes(perm.code)}
                                    onChange={() => handlePermissionToggle(perm.code)}
                                  />
                                  <span className="text-sm text-gray-700">
                                    {perm.description || perm.code}
                                  </span>
                                </label>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                 
                 <p className="text-xs text-gray-500 mt-2">
                   * Select permissions to assign to this role
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
                  {loadingCreate ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Role Details Modal */}
      {showViewDetailsModal && viewingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Role Details</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Error message if any */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}
              
              {/* Role Header */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="text-blue-600" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{viewingRole.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      viewingRole.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {viewingRole.status}
                    </span>
                    <span className="text-gray-500 text-sm">
                      Created: {new Date(viewingRole.createdDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">DESCRIPTION</h4>
                <p className="text-gray-800">{viewingRole.description}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-700 mb-1">PERMISSIONS</h4>
                  <p className="text-2xl font-bold text-blue-800">{viewingRole.permissions.length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-purple-700 mb-1">ASSIGNED USERS</h4>
                  <p className="text-2xl font-bold text-purple-800">{viewingRole.users}</p>
                </div>
              </div>

              {/* Permissions List */}
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-3">PERMISSIONS</h4>
                <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {viewingRole.permissions.length === 0 ? (
                    <div className="p-4 text-gray-500 text-center">No permissions assigned to this role</div>
                  ) : (
                    viewingRole.permissions.map((perm, idx) => {
                      // Find the permission details from the permissions list
                      const permDetails = permissions.find(p => p.code === perm);
                      
                      return (
                        <div key={idx} className="p-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">{permDetails?.description || perm}</p>
                            <span className="text-xs text-gray-500">{perm}</span>
                          </div>
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded font-medium">
                            {permDetails?.module || 'Unknown'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">METADATA</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Created By:</span>
                    <p className="font-medium text-gray-800">{viewingRole.fullDetails?.created_by || 'System'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Created At:</span>
                    <p className="font-medium text-gray-800">
                      {new Date(viewingRole.createdDate).toLocaleString()}
                    </p>
                  </div>
                  {viewingRole.fullDetails?.updated_by && (
                    <>
                      <div>
                        <span className="text-gray-500">Last Updated By:</span>
                        <p className="font-medium text-gray-800">{viewingRole.fullDetails.updated_by}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Updated At:</span>
                        <p className="font-medium text-gray-800">
                          {new Date(viewingRole.fullDetails.updated_at).toLocaleString()}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end bg-gray-50">
              <button
                onClick={handleCloseModal}
                type="button"
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;