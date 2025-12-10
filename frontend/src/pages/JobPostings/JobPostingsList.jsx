import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jobPostingService from '../../services/jobPostingService';
import StatusDropdown from '../../components/JobPostings/StatusDropdown';
import Nts_logo from '../../assets/Nts_logo/NTSLOGO.png';
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
  Business as BusinessIcon
} from '@mui/icons-material';

/**
 * JobPostingsList component
 * Displays a list of job postings with filtering options
 */
function JobPostingsList() {
  const [jobPostings, setJobPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [sortOption, setSortOption] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  // Fetch job postings on component mount and when filters change
  useEffect(() => {
    fetchJobPostings();
  }, [activeTab, searchQuery, filters, sortOption]);

  const fetchJobPostings = async () => {
    try {
      setLoading(true);
      
      // Prepare filter parameters
      const filterParams = {
        ...filters,
        status: activeTab !== 'all' ? activeTab : undefined,
        search: searchQuery || undefined,
        sort: sortOption
      };
      
      const response = await jobPostingService.getJobPostings(filterParams);
      setJobPostings(response.job_postings || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching job postings:', err);
      setError('Failed to load job postings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (jobId, newStatus) => {
    console.log(`Updating job ${jobId} status to ${newStatus} in list view`);
    
    // Show error message for demonstration
    setStatusUpdateError({
      [jobId]: true
    });
    
    // Clear error after 3 seconds
    setTimeout(() => {
      setStatusUpdateError({});
    }, 3000);
    
    try {
      // Update locally first for better UX
      setJobPostings(prevPostings =>
        prevPostings.map(job =>
          job.id === jobId ? { ...job, status: newStatus } : job
        )
      );
      
      // Try to refresh the list to get the latest data, but don't override local state if it fails
      try {
        await fetchJobPostings();
      } catch (fetchError) {
        console.warn('Could not refresh job postings after status change:', fetchError);
        // The local state update is still maintained, so the UI will reflect the change
      }
    } catch (err) {
      console.error('Error in handleStatusChange:', err);
      // Even on error, keep the local state updated for better UX
    }
  };
  
  // Handle delete button click
  const handleDeleteClick = (e, jobId) => {
    e.preventDefault();
    e.stopPropagation();
    setJobToDelete(jobId);
    setShowDeleteConfirm(true);
  };

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
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 font-serif tracking-tight animate-slideInLeft">Job Postings</h1>
          <p className="text-gray-600 mt-2 animate-slideInLeft animation-delay-100">Manage and track all your job openings in one place</p>
        </div>
        <Link
          to="/job-postings/new"
          className="btn btn-primary group relative overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-slideInRight"
        >
          <span className="relative z-10 flex items-center">
            <AddIcon className="h-5 w-5 mr-2 transition-transform duration-300 group-hover:rotate-90" />
            Create Job
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
        </Link>
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

      {/* Search and Filters */}
      <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-slideInUp">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative flex-grow max-w-xl group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400 transition-colors duration-300 group-focus-within:text-primary-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search jobs by title, skills, or company..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all duration-300 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <CloseIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-outline btn-sm group hover:bg-primary-50 hover:border-primary-500 transition-all duration-300"
              >
                <FilterIcon className="h-4 w-4 mr-1 group-hover:text-primary-600" />
                Filters
                {Object.keys(filters).length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary-500 text-white rounded-full animate-pulse">
                    {Object.keys(filters).length}
                  </span>
                )}
              </button>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="btn btn-outline btn-sm group hover:bg-primary-50 hover:border-primary-500 transition-all duration-300"
              >
                <SortIcon className="h-4 w-4 mr-1 group-hover:text-primary-600" />
                Sort
              </button>
              
              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-slideInDown">
                  {['newest', 'oldest', 'title', 'company'].map(option => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortOption(option);
                        setShowSortMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-primary-50 transition-colors duration-200 ${
                        sortOption === option ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">    
          {jobPostings.map((job, index) => (
            <Link
              key={job.id}
              to={`/job-postings/${job.id}`}
              className={`
                group relative bg-white rounded-2xl overflow-hidden border border-gray-100
                transform transition-all duration-500 hover:scale-105 hover:shadow-2xl
                animate-slideInUp cursor-pointer
              `}
              style={{ animationDelay: `${index * 100}ms` }}
              onMouseEnter={() => setHoveredCard(job.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="relative">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Status dropdown */}
                <div
                  className="absolute top-4 right-4 z-10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  data-testid={`status-dropdown-${job.id}`}
                >
                  <StatusDropdown
                    key={`status-${job.id}-${job.status}`}
                    jobId={job.id}
                    currentStatus={job.status || 'active'}
                    onStatusChange={(newStatus) => handleStatusChange(job.id, newStatus)}
                  />
                  
                  
                </div>
                
                <div className="p-6 relative">
                  {/* Header with company avatar */}
                  <div className="flex items-start mb-4">
                     <div className="flex-shrink-0 rounded-xl
    text-white flex items-center justify-center font-bold text-lg
    shadow-md transform transition-all duration-300 bg-white">
                        <div className="h-11 w-11 flex items-center">
                          <img
                            src={Nts_logo}
                            alt="NTSLOGO"f
                            className="h-11 w-11 object-contain"
                          />
                        </div>
                      </div>
                     
                   
                    <div className="ml-2  flex-grow">
                      <h3 className="text-2xl font-bold text-blue-600 group-hover:text-primary-700 transition-colors duration-300 -mt-1.5">
                        {job.job_title}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <BusinessIcon className="h-3 w-3 mr-1" />
                        {job.company}
                      </p>
                    </div>
                  </div>
                  
                  {/* Job details with icons */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                      <WorkIcon className="h-4 w-4 mr-2 text-primary-400 group-hover:text-primary-500" />
                      <span className="font-medium">{job.job_type || 'Full-time'}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                      <LocationIcon className="h-4 w-4 mr-2 text-primary-400 group-hover:text-primary-500" />
                      <span>{job.location || 'Remote'}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                      <TimeIcon className="h-4 w-4 mr-2 text-primary-400 group-hover:text-primary-500" />
                      <span>{job.experience_level || 'Entry Level'}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                      <CalendarIcon className="h-4 w-4 mr-2 text-primary-400 group-hover:text-primary-500" />
                      <span>Posted {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Skills tags */}
                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.required_skills.slice(0, 3).map((skill, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg group-hover:bg-primary-100 group-hover:text-primary-700 transition-colors duration-300"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.required_skills.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-lg">
                          +{job.required_skills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Footer with stats */}
                  <div className="pt-4 border-t border-gray-100 flex items-center">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <GroupIcon className="h-4 w-4 mr-1" />
                        <span className="font-medium">0</span> applicants
                      </span>
                      <span className="flex items-center">
                        <ViewIcon className="h-4 w-4 mr-1" />
                        <span className="font-medium">0</span> views
                      </span>
                    </div>
                  </div>
                  
                  {/* Delete button at bottom right */}
                  <div
                    className="absolute bottom-4 right-4 z-10"
                    onClick={(e) => handleDeleteClick(e, job.id)}
                  >
                    <button
                      className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors duration-300"
                      aria-label="Delete job posting"
                    >
                      <DeleteIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </Link>
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
          <Link
            to="/job-postings/new"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105"
          >
            <AddIcon className="-ml-1 mr-2 h-5 w-5" />
            Create Your First Job
          </Link>
        </div>
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
