import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import interviewService from '../services/interviewService';

// Material UI Icons
import {
  Add as AddIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

/**
 * InterviewList page component
 * Shows a paginated list of all interviews with filtering and search
 */
function InterviewList() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInterviews, setTotalInterviews] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch interviews on component mount and when page, pageSize, or filters change
  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const response = await interviewService.getInterviews(page, pageSize);
        
        setInterviews(response.interviews || []);
        setTotalPages(Math.ceil((response.total || 0) / pageSize));
        setTotalInterviews(response.total || 0);
        setError(null);
      } catch (err) {
        console.error('Error fetching interviews:', err);
        setError('Failed to load interviews. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [page, pageSize]);

  // Handle interview deletion
  const handleDeleteInterview = async (interviewId) => {
    if (window.confirm('Are you sure you want to delete this interview? This action cannot be undone.')) {
      try {
        await interviewService.deleteInterview(interviewId);
        // Refresh the list after deletion
        const response = await interviewService.getInterviews(page, pageSize);
        setInterviews(response.interviews || []);
        setTotalPages(Math.ceil((response.total || 0) / pageSize));
        setTotalInterviews(response.total || 0);
      } catch (err) {
        console.error('Error deleting interview:', err);
        // Display the specific error message from the backend if available
        const errorMessage = err.detail || 'Failed to delete interview. Please try again later.';
        setError(errorMessage);
        // Auto-clear error after 5 seconds
        setTimeout(() => setError(null), 5000);
      }
    }
  };

  // Get status badge based on interview status
  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <ScheduleIcon className="h-3 w-3 mr-1" />
            Scheduled
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CompletedIcon className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <CancelledIcon className="h-3 w-3 mr-1" />
            Cancelled
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <ScheduleIcon className="h-3 w-3 mr-1" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            Draft
          </span>
        );
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter interviews based on search term and status filter
  const filteredInterviews = interviews.filter((interview) => {
    const matchesSearch = 
      searchTerm === '' || 
      interview.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.candidate_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.job_role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary-500 font-serif animate-fadeIn animate-sparkle">Interviews</h1>
        {/* <Link
          to="/interviews/new"
          className="inline-flex items-center px-6 py-2 border border-transparent rounded-full shadow-md text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 transform hover:-translate-y-1 transition-all duration-300"
        >
          <AddIcon className="-ml-1 mr-2 h-5 w-5" />
          New Interview
        </Link> */}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="card p-4 shadow-lg border-t-4 border-primary-500 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm search-bar-animate"
              placeholder="✨ Search interviews..."
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="flex items-center space-x-2">
                <div className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm font-serif min-w-[120px] flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">
                    {statusFilter === 'all' ? 'All Statuses' :
                     statusFilter === 'scheduled' ? 'Scheduled' :
                     statusFilter === 'in_progress' ? 'In Progress' :
                     statusFilter === 'completed' ? 'Completed' : 'Cancelled'}
                  </span>
                  <FilterIcon className="h-5 w-5 text-primary-500 ml-2" />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="relative">
              <div className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm font-serif min-w-[120px] flex items-center justify-between">
                <span className="text-gray-900 dark:text-white">
                  {pageSize} per page
                </span>
                <FilterIcon className="h-5 w-5 text-primary-500 ml-2" />
              </div>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Interviews Table */}
      <div className="card overflow-hidden shadow-lg border-t-4 border-secondary-500 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredInterviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/30 dark:to-secondary-900/30">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider font-serif animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                    Candidate
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider font-serif animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                    Job Role
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider font-serif animate-fadeIn" style={{ animationDelay: '0.5s' }}>
                    Scheduled Date
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider font-serif animate-fadeIn" style={{ animationDelay: '0.6s' }}>
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider font-serif animate-fadeIn" style={{ animationDelay: '0.7s' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredInterviews.map((interview, index) => (
                  <tr key={interview.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 animate-fadeIn" style={{ animationDelay: `${0.3 + (index * 0.1)}s` }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{interview.candidate_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{interview.candidate_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{interview.job_role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{formatDate(interview.scheduled_datetime)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(interview.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/interviews/${interview.id}`}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                      >
                        View
                      </Link>
                      <Link
                        to={`/interviews/${interview.id}/edit`}
                        className="text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-300 mr-3"
                      >
                        <EditIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteInterview(interview.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete interview"
                      >
                        <DeleteIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 font-serif">No interviews found. Create your first interview!</p>
            <Link
              to="/interviews/new"
              className="mt-4 inline-flex items-center px-6 py-2 border border-transparent rounded-full shadow-md text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 transform hover:-translate-y-1 transition-all duration-300"
            >
              <AddIcon className="-ml-1 mr-2 h-5 w-5" />
              Create Interview
            </Link>
          </div>
        )}

        {/* Pagination */}
        {filteredInterviews.length > 0 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * pageSize, totalInterviews)}</span> of{' '}
                  <span className="font-medium">{totalInterviews}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === page
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600 dark:bg-primary-900/30 dark:border-primary-500 dark:text-primary-400'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InterviewList;
