import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import jobPostingService from '../../services/jobPostingService';
import StatusDropdown from '../../components/JobPostings/StatusDropdown';
import AssignedUsersModal from '../../components/JobPostings/AssignedUsersModal';
import JobPostingCard from '../../components/JobPostings/JobPostingCard';
import Nts_logo from '../../assets/Nts_logo/NTSLOGO.png';
import { useAuth } from "../../contexts/AuthContext";
import { PERMISSIONS } from "../../constants/permissions";

// Material UI Icons
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Share as ShareIcon,
  MoreVert as MoreIcon,
  TrendingUp as TrendingIcon,
  Group as GroupIcon,
  CalendarToday as CalendarIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Business as BusinessIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';

/**
 * JobPostingsList component
 * Displays a list of job postings with filtering options
 */
function JobPostingsList() {
  const location = useLocation();
  const [jobPostings, setJobPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(location.state?.filterActive ? 'active' : 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [sortOption, setSortOption] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null); // Kept for backward compatibility
  const [showAssignedUsersModal, setShowAssignedUsersModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showAssignPanel, setShowAssignPanel] = useState(false);

  // Fetch job postings on component mount and when filters change
  useEffect(() => {
    fetchJobPostings();
  }, [activeTab, searchQuery, filters, sortOption]);

  // Handle navigation from dashboard with filterActive state
  useEffect(() => {
    if (location.state?.filterActive) {
      setActiveTab('active');
    }
  }, [location.state]);

  const { hasPermission } = useAuth();

  const canViewJobs =
    hasPermission(PERMISSIONS.JOB_VIEW) ||
    hasPermission(PERMISSIONS.JOB_VIEW) ||
    hasPermission(PERMISSIONS.JOB_VIEW_ASSIGNED);
  const canCreateJob = hasPermission(PERMISSIONS.JOB_CREATE);
  const canChangeStatus = hasPermission(PERMISSIONS.JOB_POSTING_STATUS);
  const canDeleteJob = hasPermission(PERMISSIONS.JOB_DELETE);
  const canEditJob = hasPermission(PERMISSIONS.JOB_EDIT);
  const canAssign = hasPermission(PERMISSIONS.JOB_ASSIGN);

  const fetchJobPostings = async () => {
  try {
    setLoading(true);
    setError(null);

    const filterParams = {
      ...filters,
      status: activeTab !== 'all' ? activeTab : undefined,
      search: searchQuery || undefined,
      sort: sortOption
    };

    const response = await jobPostingService.getJobPostings(filterParams);

    // ✅ ALWAYS treat missing / empty as success
    const jobs = Array.isArray(response?.job_postings)
      ? response.job_postings
      : [];

    setJobPostings(jobs);

  } catch (err) {
    console.error('Error fetching job postings:', err);

    // ✅ Only show error for REAL failures
    if (
      err?.response?.status === 401 ||
      err?.response?.status >= 500
    ) {
      setError('Failed to load job postings. Please try again later.');
    } else {
      // 404 / empty / filtered-out = NO ERROR
      setJobPostings([]);
      setError(null);
    }
  } finally {
    setLoading(false);
  }
};

  // Handle status change
  const handleStatusChange = async (jobId, newStatus) => {
    console.log(`Updating job ${jobId} status to ${newStatus} in list view`);
    
    // Show loading state
    setStatusUpdateError({
      [jobId]: true
    });
    
    try {
      // Update locally first for better UX
      setJobPostings(prevPostings =>
        prevPostings.map(job =>
          job.id === jobId ? { ...job, status: newStatus } : job
        )
      );
      
      // Call the API to update the status
      const response = await jobPostingService.changeJobPostingStatus(jobId, newStatus);
      
      // Clear error/loading state after successful update
      setStatusUpdateError({});
      
      // Try to refresh the list to get the latest data, but don't override local state if it fails
      try {
        await fetchJobPostings();
      } catch (fetchError) {
        console.warn('Could not refresh job postings after status change:', fetchError);
        // The local state update is still maintained, so the UI will reflect the change
      }
    } catch (err) {
      console.error('Error in handleStatusChange:', err);
      
      // Show error message for 3 seconds
      setStatusUpdateError({
        [jobId]: true,
        isError: true
      });
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setStatusUpdateError({});
      }, 3000);
      
      // Even on error, keep the local state updated for better UX
    }
  };
  
  // Handle delete button click
  const handleDeleteClick = (e, jobId) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setJobToDelete(jobId);
    setShowDeleteConfirm(true);
  };

  // Handle 3-dots menu (kept for backward compatibility)
  const handleMenuToggle = (e, jobId) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActionMenu(showActionMenu === jobId ? null : jobId);
  };

  // Handle view assigned users click
  const handleViewAssignedUsersClick = (e, job) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedJob(job);
    // setShowAssignedUsersModal(true);
    setShowActionMenu(null);
    setShowAssignPanel(true); // Open in view mode
  };

  // Handle assign users click
  const handleAssignUsersClick = (e, job) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedJob(job);
    setShowAssignedUsersModal(true);
    setShowActionMenu(null);
    setShowAssignPanel(true); // Open directly in assign mode
  };
  
  // Close action menu when clicking outside (kept for backward compatibility)
  const actionMenuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setShowActionMenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;
    
    try {
      await jobPostingService.deleteJobPosting(jobToDelete);
      // Update UI by removing the deleted job
      setJobPostings(prevPostings =>
        prevPostings.filter(job => job.id !== jobToDelete)
      );
      setShowDeleteConfirm(false);
      setJobToDelete(null);
    } catch (err) {
      console.error('Error deleting job posting:', err);
      setError('Failed to delete job posting. Please try again later.');
      setShowDeleteConfirm(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Get status count
  const getStatusCount = (status) => {
    if (status === 'all') return jobPostings.length;
    return jobPostings.filter(job => job.status === status).length;
  };

  // Generate company initial
  const getCompanyInitial = (company) => {
    return company ? company.charAt(0).toUpperCase() : 'C';
  };

  // Get random color for company avatar
  const getCompanyColor = (company) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    
    // Use company name to deterministically select a color
    const index = company ? company.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  // Error message for status update
  const [statusUpdateError, setStatusUpdateError] = useState({});

  return (
    <div className="space-y-6 animate-fadeIn">
  <div className="flex mb-16 items-end">
    
    {/* Left content – takes only needed width */}
    <span className="flex flex-shrink-0">
      <div
        style={{
          borderRightColor: "black",
          borderRightWidth: 1,
          whiteSpace: "nowrap",
          paddingRight: 12,
        }}
      >
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight animate-slideInLeft">
          Job Postings
        </h1>
      </div>

      <div style={{ paddingLeft: 6, maxWidth: 300 }}>
        <p className="text-gray-600 mt-2 animate-slideInLeft animation-delay-100 pr-1">
          Manage and track all your job openings in one place
        </p>
      </div>
    </span>

    {/* Right content – fills remaining space */}
    <div className="flex flex-1 justify-end">

          <div className="flex items-center gap-4 justify-end w-full">

            {/* Filter Icon */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="h-11 w-11 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 transition"
            >
              <FilterIcon className="text-gray-600" />
            </button>

            {/* Search Box */}
            <div className="relative w-[160px]">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search"
                className="w-full h-11 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Create Job Button */}
            {canCreateJob && (
              <Link
                to="/job-postings/new"
                className="h-11 px-6 flex items-center gap-2 bg-[#2563EB] text-white rounded-lg font-medium transition"
              >
                <AddIcon fontSize="small" />
                Create Job
              </Link>
            )}
          </div>

      </div> 
    </div>

      {error && (
        <div className="bg-danger-50 border-l-4 border-danger-500 p-4 rounded-r-md animate-slideIn">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          </div>
        </div>
      )}

     

      {/* Status Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
        <nav className="flex space-x-2">
          {['all', 'active', 'draft', 'closed', 'archived'].map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`
                relative px-6 py-3 rounded-lg font-medium transition-all duration-300 transform
                ${activeTab === tab 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg scale-105' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <span className="relative z-10">
                {tab.charAt(0).toUpperCase() + tab.slice(1)} 
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTab === tab ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {getStatusCount(tab)}
                </span>
              </span>
             
            </button>
          ))}
        </nav>
      </div>

      {/* Job Postings Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-600 absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-500 animate-pulse">Loading job postings...</p>
        </div>
      ) : jobPostings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {jobPostings.map((job, index) => (
            <div
              key={job.id}
              style={{ animationDelay: `${index * 100}ms` }}
              className="animate-slideInUp h-full w-full"
            >
              <JobPostingCard
                job={job}
                onDelete={(jobId) => handleDeleteClick(null, jobId)}
                onAssign={(job) => handleAssignUsersClick(null, job)}
                onChangeStatus={(jobId, newStatus) => handleStatusChange(jobId, newStatus)}
                canEdit={canEditJob}
                canDelete={canDeleteJob}
                canChangeStatus={canChangeStatus}
                canAssign = {canAssign}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200 animate-fadeIn">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 mb-6 animate-bounce">
            <WorkIcon className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Job Postings Yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Start building your talent pipeline by creating your first job posting
          </p>
          {canCreateJob && (
          <Link
            to="/job-postings/new"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105"
          >
            <AddIcon className="-ml-1 mr-2 h-5 w-5" />
            Create Your First Job
          </Link>
          )}
        </div>
      )}
      
      {/* Assigned Users Modal */}
      {showAssignedUsersModal && selectedJob && (
        <AssignedUsersModal
          isOpen={showAssignedUsersModal}
          onClose={() => setShowAssignedUsersModal(false)}
          jobId={selectedJob.id}
          jobTitle={selectedJob.job_title}
          initialShowAssignPanel={showAssignPanel}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl animate-fadeIn">
            <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this job posting? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobPostingsList;
