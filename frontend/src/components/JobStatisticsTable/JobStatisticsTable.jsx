import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jobStatisticsService from '../../services/jobStatisticsService';
import {
  Work as JobIcon,
  CheckCircle as ActiveIcon,
  Cancel as ClosedIcon,
  Archive as ArchivedIcon,
  Drafts as DraftIcon,
  ArrowForward as ViewAllIcon
} from '@mui/icons-material';

function JobStatisticsTable() {
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobStatistics = async () => {
      try {
        setLoading(true);
        const data = await jobStatisticsService.getJobStatistics();
        setStatistics(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching job statistics:', err);
        setError('Failed to load job statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobStatistics();
  }, []);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <ActiveIcon className="h-3 w-3 mr-1" />
            Active
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <ClosedIcon className="h-3 w-3 mr-1" />
            Closed
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <ArchivedIcon className="h-3 w-3 mr-1" />
            Archived
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <DraftIcon className="h-3 w-3 mr-1" />
            Draft
          </span>
        );
      default:
        // Determine the most appropriate fallback based on the status value
        console.log(`Unknown job status: ${status}`);
        if (status) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <JobIcon className="h-3 w-3 mr-1" />
              {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
            </span>
          );
        }
        // If status is null/undefined, show as Unknown
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <JobIcon className="h-3 w-3 mr-1" />
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <span className="mr-2">Job-wise Statistics</span>
          </h2>
          <a href="#" className="text-blue-500 text-sm">View All</a>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        ) : statistics.length === 0 ? (
          <div className="text-center py-8">
            <JobIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No job statistics available</h3>
            <p className="text-gray-500">Create job postings to see statistics here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-2">
                    Job Title
                  </th>
                  <th className="px-4 py-2">
                    Posted
                  </th>
                  <th className="px-4 py-2">
                   Applications
                  </th>
                  <th className="px-4 py-2">
                    Shortlisted
                  </th>
                  <th className="px-4 py-2">
                    Interviewed
                  </th>
                  <th className="px-4 py-2">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statistics.map((job, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{job.job_title}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{job.posted_days_ago} days ago</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-gray-900">{job.number_of_applications}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-blue-600">{job.shortlisted}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-green-600">{job.interviewed}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${job.status === 'Active' ? 'bg-green-100 text-green-800' :
                        job.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'}`}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobStatisticsTable;