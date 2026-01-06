import { useState, useEffect } from 'react';
import interviewService from '../services/interviewService';

// Material UI Icons
import {
  BarChart as ChartIcon,
  PieChart as PieChartIcon,
  Drafts as DraftIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

/**
 * Statistics page component
 * Shows interview statistics and charts
 */
function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch statistics on component mount
  useEffect(() => {
    fetchStatistics();
  }, []);

  /**
   * Fetch interview statistics
   */
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await interviewService.getInterviewStatistics();
      setStats(response.data || {});
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err.detail || 'Failed to load statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate percentage for a status
   * @param {string} status - Interview status
   * @returns {number} - Percentage
   */
  const calculatePercentage = (status) => {
    if (!stats || !stats.total_interviews || !stats.status_breakdown || !stats.status_breakdown[status]) {
      return 0;
    }
    
    return Math.round((stats.status_breakdown[status] / stats.total_interviews) * 100);
  };

  /**
   * Get color class for a status
   * @param {string} status - Interview status
   * @returns {string} - Tailwind color class
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'draft':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  /**
   * Get icon for a status
   * @param {string} status - Interview status
   * @returns {JSX.Element} - Icon component
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <ScheduleIcon className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CompletedIcon className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <CancelledIcon className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <ScheduleIcon className="h-5 w-5 text-yellow-500" />;
      case 'draft':
        return <DraftIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <DraftIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 animate-fadeIn">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300">
            INTERVIEW STATISTICS
          </span>
        </h1>
        <button
          type="button"
          onClick={fetchStatistics}
          disabled={loading}
          className="inline-flex items-center px-6 py-2 border border-transparent rounded-full shadow-md text-sm font-medium text-white bg-gradient-to-r from-sky-400 to-blue-200 hover:from-sky-500 hover:to-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 transition-all duration-300"
        >
          <RefreshIcon className="-ml-1 mr-2 h-5 w-5 animate-spin-slow" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4">
          <div className="flex">
            <ErrorIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-full p-3 shadow-md">
                    <ChartIcon className="h-7 w-7 text-gray-800 dark:text-gray-200 font-bold" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Interviews</p>
                    <p className="text-3xl font-semibold text-gray-800 dark:text-gray-200">{stats.total_interviews || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-full p-3 shadow-md">
                    <ScheduleIcon className="h-7 w-7 text-gray-800 dark:text-gray-200 font-bold" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Scheduled</p>
                    <p className="text-3xl font-semibold text-gray-800 dark:text-gray-200">{stats.status_breakdown?.scheduled || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-full p-3 shadow-md">
                    <CompletedIcon className="h-7 w-7 text-gray-800 dark:text-gray-200 font-bold" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-3xl font-semibold text-gray-800 dark:text-gray-200">{stats.status_breakdown?.completed || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-full p-3 shadow-md">
                    <DraftIcon className="h-7 w-7 text-gray-800 dark:text-gray-200 font-bold" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Drafts</p>
                    <p className="text-3xl font-semibold text-gray-800 dark:text-gray-200">{stats.status_breakdown?.draft || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="card shadow-lg border-t-4 border-sky-400 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2 text-sky-400" />
              Interview Status Breakdown
            </h2>

            <div className="space-y-4">
              {/* Scheduled */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <ScheduleIcon className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Scheduled</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stats.status_breakdown?.scheduled || 0} ({calculatePercentage('scheduled')}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-indigo-200 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${calculatePercentage('scheduled')}%` }}
                  ></div>
                </div>
              </div>

              {/* Completed */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <CompletedIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Completed</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stats.status_breakdown?.completed || 0} ({calculatePercentage('completed')}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-gradient-to-r from-teal-400 to-green-200 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${calculatePercentage('completed')}%` }}
                  ></div>
                </div>
              </div>

              {/* In Progress */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <ScheduleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">In Progress</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stats.status_breakdown?.in_progress || 0} ({calculatePercentage('in_progress')}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-yellow-200 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${calculatePercentage('in_progress')}%` }}
                  ></div>
                </div>
              </div>

              {/* Cancelled */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <CancelledIcon className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cancelled</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stats.status_breakdown?.cancelled || 0} ({calculatePercentage('cancelled')}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-gradient-to-r from-red-400 to-pink-200 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${calculatePercentage('cancelled')}%` }}
                  ></div>
                </div>
              </div>

              {/* Draft */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <DraftIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Draft</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stats.status_breakdown?.draft || 0} ({calculatePercentage('draft')}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-gradient-to-r from-gray-400 to-gray-200 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${calculatePercentage('draft')}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Chart */}
          <div className="card shadow-lg border-t-4 border-sky-400 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <ChartIcon className="h-5 w-5 mr-2 text-sky-400" />
              Visual Representation
            </h2>

            <div className="flex justify-center">
              <div className="relative w-64 h-64">
                {/* Simple pie chart using CSS conic gradient */}
                <div
                  className="w-full h-full rounded-full shadow-lg animate-pulse-slow"
                  style={{
                    background: `conic-gradient(
                      #4ade80 0% ${calculatePercentage('completed')}%,
                      #60a5fa ${calculatePercentage('completed')}% ${calculatePercentage('completed') + calculatePercentage('scheduled')}%,
                      #fbbf24 ${calculatePercentage('completed') + calculatePercentage('scheduled')}% ${calculatePercentage('completed') + calculatePercentage('scheduled') + calculatePercentage('in_progress')}%,
                      #f87171 ${calculatePercentage('completed') + calculatePercentage('scheduled') + calculatePercentage('in_progress')}% ${calculatePercentage('completed') + calculatePercentage('scheduled') + calculatePercentage('in_progress') + calculatePercentage('cancelled')}%,
                      #9ca3af ${calculatePercentage('completed') + calculatePercentage('scheduled') + calculatePercentage('in_progress') + calculatePercentage('cancelled')}% 100%
                    )`
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white dark:bg-gray-800 rounded-full w-40 h-40 flex items-center justify-center shadow-inner">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
                      <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-200">{stats.total_interviews || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Legend items */}
              <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 animate-fadeIn" style={{ animationDelay: '0.7s' }}>
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-teal-400 to-green-200 mr-2"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Completed</span>
              </div>
              <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 animate-fadeIn" style={{ animationDelay: '0.8s' }}>
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-indigo-200 mr-2"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Scheduled</span>
              </div>
              <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 animate-fadeIn" style={{ animationDelay: '0.9s' }}>
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-yellow-200 mr-2"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">In Progress</span>
              </div>
              <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 animate-fadeIn" style={{ animationDelay: '1s' }}>
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-400 to-pink-200 mr-2"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Cancelled</span>
              </div>
              <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 animate-fadeIn" style={{ animationDelay: '1.1s' }}>
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-400 to-gray-200 mr-2"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Draft</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No statistics available. Start by creating interviews!</p>
        </div>
      )}
    </div>
  );
}

export default Statistics;