import { useState, useEffect } from 'react';
import { fetchUsers } from '../../services/userManagementService';
import { getJobAssignments, assignJob, removeAssignedUser } from '../../services/jobAssignmentService';

// Material UI Icons
import {
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

/**
 * Modal component to show users assigned to a job posting and allow assigning new users
 */
function AssignedUsersModal({ isOpen, onClose, jobId, jobTitle, initialShowAssignPanel = false }) {
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [userBeingRemoved, setUserBeingRemoved] = useState(null);
  const [error, setError] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [showAssignPanel, setShowAssignPanel] = useState(initialShowAssignPanel);

  // Fetch assigned users and all users when modal opens
  useEffect(() => {
    if (isOpen && jobId) {
      fetchData();
    }
  }, [isOpen, jobId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users assigned to this job
      const assigned = await getJobAssignments(jobId);
      setAssignedUsers(assigned);

      // Fetch all users
      const users = await fetchUsers();
      setAllUsers(users);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUsers = async () => {
    if (selectedUserIds.length === 0) return;

    try {
      setAssigning(true);
      setError(null);

      await assignJob(jobId, selectedUserIds);
      
      // Reset selection and refresh data
      setSelectedUserIds([]);
      setShowAssignPanel(true);
      await fetchData();
    } catch (err) {
      console.error('Error assigning users:', err);
      setError('Failed to assign users. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveUser = async (userId) => {
    try {
      setRemoving(true);
      setUserBeingRemoved(userId);
      setError(null);

      await removeAssignedUser(jobId, userId);
      
      // Refresh data after successful removal
      await fetchData();
    } catch (err) {
      console.error('Error removing user:', err);
      setError('Failed to remove user. Please try again.');
    } finally {
      setRemoving(false);
      setUserBeingRemoved(null);
    }
  };

  // Filter users based on search query
  const filteredUsers = allUsers.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           user.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filter out users who are already assigned
  const unassignedUsers = filteredUsers.filter(user => 
    !assignedUsers.some(assignedUser => assignedUser._id === user._id)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl animate-fadeIn overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {!showAssignPanel ? 'Assign Users' : 'Users Assigned to Job'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <CloseIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Job info */}
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="font-medium text-gray-900">{jobTitle}</div>
          <div className="text-sm text-gray-500">Job ID: {jobId}</div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Content */}
        {!showAssignPanel ? (
          <div>
            {/* Search input for assign panel */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* User list for assignment */}
            <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg mb-4">
              {loading ? (
                <div className="p-4 text-center">Loading users...</div>
              ) : unassignedUsers.length > 0 ? (
                unassignedUsers.map(user => (
                  <div
                    key={user._id}
                    className="flex items-center p-3 border-b border-gray-100 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      id={`user-${user._id}`}
                      className="h-5 w-5 text-primary-600 rounded"
                      checked={selectedUserIds.includes(user._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUserIds([...selectedUserIds, user._id]);
                        } else {
                          setSelectedUserIds(selectedUserIds.filter(id => id !== user._id));
                        }
                      }}
                    />
                    <label
                      htmlFor={`user-${user._id}`}
                      className="ml-3 flex-grow cursor-pointer"
                    >
                      <div className="font-medium">{user.first_name} {user.last_name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </label>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {searchQuery ? "No matching users found" : "No users available to assign"}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAssignPanel(true)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignUsers}
                disabled={selectedUserIds.length === 0 || assigning}
                className={`px-4 py-2 rounded-md text-white ${
                  selectedUserIds.length === 0 || assigning
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-primary-600 hover:bg-primary-700"
                }`}
              >
                {assigning ? (
                  <>
                    <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Assigning...
                  </>
                ) : (
                  `Assign Selected Users (${selectedUserIds.length})`
                )}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* List of assigned users */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
                  <span className="ml-2 text-gray-500">Loading users...</span>
                </div>
              ) : assignedUsers.length > 0 ? (
                <div className="space-y-3">
                  {assignedUsers.map(user => (
                    <div key={user._id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </div>
                      <div className="ml-3 flex-grow">
                        <div className="font-medium">{user.first_name} {user.last_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveUser(user._id)}
                        disabled={removing && userBeingRemoved === user._id}
                        className={`p-2 rounded-full ${
                          removing && userBeingRemoved === user._id
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-red-500 hover:bg-red-50"
                        }`}
                        title="Remove user from job"
                      >
                        {removing && userBeingRemoved === user._id ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                        ) : (
                          <DeleteIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <PersonIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>No users assigned to this job posting yet.</p>
                </div>
              )}
            </div>

            {/* Action button to assign users */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAssignPanel(false)}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
              >
                <PersonAddIcon className="h-5 w-5 mr-2" />
                Assign Users
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AssignedUsersModal;