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
  Lightbulb as AIIcon
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
        <h1 className="text-3xl font-bold text-gray-900 font-serif">Job Postings</h1>
        <Link
          to="/job-postings/new"
          className="btn btn-primary"
        >
          <AddIcon className="h-5 w-5 mr-2" />
          Create Job
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative flex-grow max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search jobs by title, skills, or company..."
            className="input input-bordered w-full pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="btn btn-outline btn-sm">
            <FilterIcon className="h-4 w-4 mr-1" />
            Filters
          </button>
          <button className="btn btn-outline btn-sm">
            <SortIcon className="h-4 w-4 mr-1" />
            Sort
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('all')}
            className={`tab-button ${activeTab === 'all' ? 'tab-active' : 'tab-inactive'}`}
          >
            All Jobs ({getStatusCount('all')})
          </button>
          <button
            onClick={() => handleTabChange('active')}
            className={`tab-button ${activeTab === 'active' ? 'tab-active' : 'tab-inactive'}`}
          >
            Active ({getStatusCount('active')})
          </button>
          <button
            onClick={() => handleTabChange('draft')}
            className={`tab-button ${activeTab === 'draft' ? 'tab-active' : 'tab-inactive'}`}
          >
            Draft ({getStatusCount('draft')})
          </button>
          <button
            onClick={() => handleTabChange('closed')}
            className={`tab-button ${activeTab === 'closed' ? 'tab-active' : 'tab-inactive'}`}
          >
            Closed ({getStatusCount('closed')})
          </button>
          <button
            onClick={() => handleTabChange('archived')}
            className={`tab-button ${activeTab === 'archived' ? 'tab-active' : 'tab-inactive'}`}
          >
            Archived ({getStatusCount('archived')})
          </button>
        </nav>
      </div>

      {/* Job Postings Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : jobPostings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobPostings.map((job) => (
            <Link
              to={`/job-postings/${job.id}`}
              key={job.id}
              className="card bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg overflow-hidden border border-gray-200"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    {/* <div className={`flex-shrink-0 h-1 w-1 rounded-full ${getCompanyColor(job.company)} text-white flex items-center justify-center font-bold text-lg`}>
                      {getCompanyInitial(job.company)}
                    </div> */}
                    <div className="ml-1">
                      <h3 className="text-lg font-semibold text-gray-900">{job.job_title}</h3>
                      <p className="text-sm text-gray-600">{job.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="badge badge-sm bg-green-100 text-green-800 border-green-200">New</span>
                    {job.ai_generated && (
                      <span className="badge badge-sm bg-blue-100 text-blue-800 border-blue-200 flex items-center">
                        <AIIcon className="h-3 w-3 mr-1" />
                        AI-Powered
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <WorkIcon className="h-4 w-4 mr-1 text-gray-400" />
                    <span>{job.job_type}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <LocationIcon className="h-4 w-4 mr-1 text-gray-400" />
                    <span>{job.location}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <TimeIcon className="h-4 w-4 mr-1 text-gray-400" />
                    <span>0 years</span>
                  </div>
                </div>
                
                
              </div>
              
              {/* Actions */}
              {/* <div className="px-4 py-2 bg-white border-t border-gray-200 flex justify-end items-center" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center space-x-2">
                  <button className="btn btn-ghost btn-sm btn-circle">
                    <ShareIcon className="h-4 w-4 text-gray-500" />
                  </button>
                  <button className="btn btn-ghost btn-sm btn-circle">
                    <MoreIcon className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div> */}
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center bg-gray-50 rounded-xl border border-gray-200">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 text-gray-400 mb-4">
            <WorkIcon className="h-8 w-8" />
          </div>
          <p className="text-gray-500 mb-4">No job postings found. Create your first job posting!</p>
          <Link
            to="/job-postings/new"
            className="btn btn-primary"
          >
            <AddIcon className="-ml-1 mr-2 h-5 w-5" />
            Create Job
          </Link>
        </div>
      )}
    </div>
  );
}

export default JobPostingsList;