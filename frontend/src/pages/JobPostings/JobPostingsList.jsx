import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jobPostingService from '../../services/jobPostingService';

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
  Lightbulb as AIIcon,
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

  // Fetch job postings on component mount and when filters change
  useEffect(() => {
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

    fetchJobPostings();
  }, [activeTab, searchQuery, filters, sortOption]);

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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
        <nav className="flex space-x-2">
          {['all', 'active', 'draft', 'closed', 'archived'].map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`
                relative px-4 py-3 rounded-lg font-medium transition-all duration-300 transform
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
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full"></div>
              )}
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
              to={`/job-postings/${job.id}`}
              key={job.id}
              className={`
                group relative bg-white rounded-2xl overflow-hidden border border-gray-100
                transform transition-all duration-500 hover:scale-105 hover:shadow-2xl
                animate-slideInUp
              `}
              style={{ animationDelay: `${index * 100}ms` }}
              onMouseEnter={() => setHoveredCard(job.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Status indicator */}
              <div className="absolute top-4 right-4 z-10">
                <span className={`
                  px-3 py-1 text-xs font-semibold rounded-full
                  ${job.status === 'active' ? 'bg-green-100 text-green-700' : 
                    job.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    job.status === 'closed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'}
                  transform transition-all duration-300 group-hover:scale-110
                `}>
                  {job.status || 'Active'}
                </span>
              </div>
              
              <div className="p-6 relative">
                {/* Header with company avatar */}
                <div className="flex items-start mb-4">
                  <div className={`
                    flex-shrink-0 h-12 w-12 rounded-xl ${getCompanyColor(job.company)} 
                    text-white flex items-center justify-center font-bold text-lg
                    transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3
                  `}>
                    {getCompanyInitial(job.company)}
                  </div>
                  <div className="ml-4 flex-grow">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-300">
                      {job.job_title}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <BusinessIcon className="h-3 w-3 mr-1" />
                      {job.company}
                    </p>
                  </div>
                </div>
                
                {/* AI Badge */}
                {/* {job.ai_generated && (
                  <div className="absolute top-6 right-6 animate-pulse">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg">
                      <AIIcon className="h-3 w-3 mr-1" />
                      AI-Powered
                    </span>
                  </div>
                )} */}
                
                {/* Job details with icons */}
                <div className="space-y-3 mb-4">
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
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
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
                  
                  {/* Action buttons on hover */}
                  {/* <div className={`
                    flex items-center space-x-2 transition-all duration-300
                    ${hoveredCard === job.id ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
                  `}>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Edit:', job.id);
                      }}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-primary-100 hover:text-primary-600 transition-colors duration-200"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Share:', job.id);
                      }}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                    >
                      <ShareIcon className="h-4 w-4" />
                    </button>
                  </div> */}
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
    </div>
  );
}

export default JobPostingsList;
