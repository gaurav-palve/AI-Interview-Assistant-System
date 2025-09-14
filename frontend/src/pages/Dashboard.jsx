import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import interviewService from '../services/interviewService';
import { useAuth } from '../contexts/AuthContext';

// Material UI Icons
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  BarChart as StatsIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

/**
 * Dashboard page component
 * Shows overview of interviews and quick actions
 */
function Dashboard() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [greeting, setGreeting] = useState('Hello');
  const [notificationCount, setNotificationCount] = useState(3);

  // Fetch interviews and stats on component mount
  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch interviews (first page, 5 items)
        const interviewsResponse = await interviewService.getInterviews(1, 5);
        setInterviews(interviewsResponse.interviews || []);
        
        // Fetch statistics
        const statsResponse = await interviewService.getInterviewStatistics();
        setStats(statsResponse.data || {});
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Get status badge based on interview status
  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return (
          <span className="badge badge-primary">
            <ScheduleIcon className="h-3 w-3 mr-1" />
            Scheduled
          </span>
        );
      case 'completed':
        return (
          <span className="badge badge-accent">
            <CompletedIcon className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="badge badge-danger">
            <CancelledIcon className="h-3 w-3 mr-1" />
            Cancelled
          </span>
        );
      case 'in_progress':
        return (
          <span className="badge badge-warning">
            <ScheduleIcon className="h-3 w-3 mr-1" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="badge bg-gray-100 text-gray-800">
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

  return (
    <div className="space-y-8 animate-fadeIn">
      {error && (
        <div className="bg-danger-50 border-l-4 border-danger-500 p-4 rounded-r-md animate-slideIn">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Link
          to="/interviews/new"
          className="card flex flex-col items-center p-6 hover:bg-gray-50 transition-all duration-300 group hover:shadow-xl rounded-xl border border-gray-200 transform hover:-translate-y-2 animate-fadeIn"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg group-hover:scale-110 transition-transform mb-3">
            <AddIcon className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors font-serif text-center">New Interview</h3>
          <p className="mt-1 text-sm text-gray-500 text-center">Schedule a new interview</p>
        </Link>

        <Link
          to="/interviews"
          className="card flex flex-col items-center p-6 hover:bg-gray-50 transition-all duration-300 group hover:shadow-xl rounded-xl border border-gray-200 transform hover:-translate-y-2 animate-fadeIn"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg group-hover:scale-110 transition-transform mb-3">
            <AssignmentIcon className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors font-serif text-center">Manage Interviews</h3>
          <p className="mt-1 text-sm text-gray-500 text-center">View and manage interviews</p>
        </Link>
        
        <Link
          to="/statistics"
          className="card flex flex-col items-center p-6 hover:bg-gray-50 transition-all duration-300 group hover:shadow-xl rounded-xl border border-gray-200 transform hover:-translate-y-2 animate-fadeIn"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg group-hover:scale-110 transition-transform mb-3">
            <StatsIcon className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors font-serif text-center">Statistics</h3>
          <p className="mt-1 text-sm text-gray-500 text-center">View interview analytics</p>
        </Link>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="card shadow-lg border-t-4 border-primary-500 animate-fadeIn hover:shadow-xl transition-all duration-300" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <StatsIcon className="h-6 w-6 mr-2 text-primary-600" />
            <span className="text-gray-800 font-serif">
              Your Statistics
            </span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stats-card stats-card-primary flex flex-col items-center justify-center p-3 rounded-lg hover:shadow-md transition-all duration-300 hover:bg-primary-50 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 text-primary-600 mb-2 transform hover:scale-110 transition-transform">
                <AssignmentIcon className="h-6 w-6" />
              </div>
              <p className="text-2xl font-bold text-gray-900 font-serif">{stats.total_interviews || 0}</p>
              <p className="text-xs font-medium text-primary-600">Total Interviews</p>
            </div>
            
            <div className="stats-card stats-card-secondary flex flex-col items-center justify-center p-3 rounded-lg hover:shadow-md transition-all duration-300 hover:bg-secondary-50 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-secondary-100 text-secondary-600 mb-2 transform hover:scale-110 transition-transform">
                <ScheduleIcon className="h-6 w-6" />
              </div>
              <p className="text-2xl font-bold text-gray-900 font-serif">{stats.status_breakdown?.scheduled || 0}</p>
              <p className="text-xs font-medium text-secondary-600">Scheduled</p>
            </div>
            
            <div className="stats-card stats-card-accent flex flex-col items-center justify-center p-3 rounded-lg hover:shadow-md transition-all duration-300 hover:bg-accent-50 animate-fadeIn" style={{ animationDelay: '0.7s' }}>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-accent-100 text-accent-600 mb-2 transform hover:scale-110 transition-transform">
                <CompletedIcon className="h-6 w-6" />
              </div>
              <p className="text-2xl font-bold text-gray-900 font-serif">{stats.status_breakdown?.completed || 0}</p>
              <p className="text-xs font-medium text-accent-600">Completed</p>
            </div>
            
            <div className="stats-card stats-card-warning flex flex-col items-center justify-center p-3 rounded-lg hover:shadow-md transition-all duration-300 hover:bg-warning-50 animate-fadeIn" style={{ animationDelay: '0.8s' }}>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-warning-100 text-warning-600 mb-2 transform hover:scale-110 transition-transform">
                <PeopleIcon className="h-6 w-6" />
              </div>
              <p className="text-2xl font-bold text-gray-900 font-serif">{stats.status_breakdown?.draft || 0}</p>
              <p className="text-xs font-medium text-warning-600">Drafts</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Interviews */}
      <div className="card shadow-lg border-t-4 border-secondary-500 animate-fadeIn hover:shadow-xl transition-all duration-300" style={{ animationDelay: '0.9s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold flex items-center">
            <TrendingUpIcon className="h-6 w-6 mr-2 text-secondary-500" />
            <span className="text-gray-800 font-serif">
              Recent Interviews
            </span>
          </h2>
          <Link
            to="/interviews"
            className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center"
          >
            View all
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : interviews.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="table-header">
                    Candidate
                  </th>
                  <th scope="col" className="table-header">
                    Job Role
                  </th>
                  <th scope="col" className="table-header">
                    Scheduled Date
                  </th>
                  <th scope="col" className="table-header">
                    Status
                  </th>
                  <th scope="col" className="table-header text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interviews.map((interview) => (
                  <tr key={interview.id} className="table-row">
                    <td className="table-cell">
                      <div className="text-sm font-medium text-gray-900">{interview.candidate_name}</div>
                      <div className="text-xs text-gray-500">{interview.candidate_email}</div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">{interview.job_role}</div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">{formatDate(interview.scheduled_datetime)}</div>
                    </td>
                    <td className="table-cell">
                      {getStatusBadge(interview.status)}
                    </td>
                    <td className="table-cell text-right text-sm font-medium">
                      <Link
                        to={`/interviews/${interview.id}`}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        <ViewIcon className="h-5 w-5 inline" />
                        <span className="sr-only">View</span>
                      </Link>
                      <Link
                        to={`/interviews/${interview.id}/edit`}
                        className="text-secondary-600 hover:text-secondary-900"
                      >
                        <EditIcon className="h-5 w-5 inline" />
                        <span className="sr-only">Edit</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center bg-gray-50 rounded-xl border border-gray-200">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 text-gray-400 mb-4">
              <AssignmentIcon className="h-8 w-8" />
            </div>
            <p className="text-gray-500 mb-4">No interviews found. Create your first interview!</p>
            <Link
              to="/interviews/new"
              className="btn btn-primary"
            >
              <AddIcon className="-ml-1 mr-2 h-5 w-5" />
              New Interview
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;