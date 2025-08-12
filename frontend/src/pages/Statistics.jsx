import { useState, useEffect } from 'react';
import interviewService from '../services/interviewService';

// Material UI Icons
import {
  BarChart as ChartIcon,
  PieChart as PieChartIcon,
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
        return <PieChartIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <PieChartIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Interview Statistics</h1>
        <button
          type="button"
          onClick={fetchStatistics}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshIcon className="-ml-1 mr-2 h-5 w-5" />
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
            <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-white bg-opacity-30 rounded-md p-3">
                    <ChartIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-white text-opacity-75">Total Interviews</p>
                    <p className="text-3xl font-semibold">{stats.total_interviews || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-white bg-opacity-30 rounded-md p-3">
                    <ScheduleIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-white text-opacity-75">Scheduled</p>
                    <p className="text-3xl font-semibold">{stats.status_breakdown?.scheduled || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-white bg-opacity-30 rounded-md p-3">
                    <CompletedIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-white text-opacity-75">Completed</p>
                    <p className="text-3xl font-semibold">{stats.status_breakdown?.completed || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-white bg-opacity-30 rounded-md p-3">
                    <PieChartIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-white text-opacity-75">Drafts</p>
                    <p className="text-3xl font-semibold">{stats.status_breakdown?.draft || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2 text-primary-600" />
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
                    className="bg-blue-500 h-2.5 rounded-full" 
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
                    className="bg-green-500 h-2.5 rounded-full" 
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
                    className="bg-yellow-500 h-2.5 rounded-full" 
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
                    className="bg-red-500 h-2.5 rounded-full" 
                    style={{ width: `${calculatePercentage('cancelled')}%` }}
                  ></div>
                </div>
              </div>

              {/* Draft */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <PieChartIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Draft</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stats.status_breakdown?.draft || 0} ({calculatePercentage('draft')}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                    className="bg-gray-500 h-2.5 rounded-full" 
                    style={{ width: `${calculatePercentage('draft')}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Chart */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <ChartIcon className="h-5 w-5 mr-2 text-primary-600" />
              Visual Representation
            </h2>

            <div className="flex justify-center">
              <div className="relative w-64 h-64">
                {/* Simple pie chart using CSS conic gradient */}
                <div 
                  className="w-full h-full rounded-full"
                  style={{
                    background: `conic-gradient(
                      ${getStatusColor('completed')} 0% ${calculatePercentage('completed')}%, 
                      ${getStatusColor('scheduled')} ${calculatePercentage('completed')}% ${calculatePercentage('completed') + calculatePercentage('scheduled')}%, 
                      ${getStatusColor('in_progress')} ${calculatePercentage('completed') + calculatePercentage('scheduled')}% ${calculatePercentage('completed') + calculatePercentage('scheduled') + calculatePercentage('in_progress')}%, 
                      ${getStatusColor('cancelled')} ${calculatePercentage('completed') + calculatePercentage('scheduled') + calculatePercentage('in_progress')}% ${calculatePercentage('completed') + calculatePercentage('scheduled') + calculatePercentage('in_progress') + calculatePercentage('cancelled')}%, 
                      ${getStatusColor('draft')} ${calculatePercentage('completed') + calculatePercentage('scheduled') + calculatePercentage('in_progress') + calculatePercentage('cancelled')}% 100%
                    )`
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white dark:bg-gray-800 rounded-full w-40 h-40 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total_interviews || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Legend items */}
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Completed</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Scheduled</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">In Progress</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Cancelled</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-gray-500 mr-2"></div>
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