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

  // ✅ Title Case helper
  const toTitleCase = (str) => {
    if (!str) return '';
    return str
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <span className="mr-2">Job Posting Statistics</span>
          </h2>
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
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No statistics available
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="min-w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-2">Job Title</th>
                  <th className="px-4 py-2 text-center">Posted</th>
                  <th className="px-4 py-2 text-center">Applications</th>
                  <th className="px-4 py-2 text-center">Shortlisted</th>
                  <th className="px-4 py-2 text-center">Interviewed</th>
                  <th className="px-4 py-2 text-center">Status</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {statistics.map((job, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {job.job_title}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-500">
                        {job.posted_days_ago} days ago
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {job.number_of_applications}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-black-600">{job.shortlisted}</div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-black-600">{job.interviewed}</div>
                    </td>

                    {/* ✅ STATUS IN TITLE CASE */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
                          ${job.status === 'active'
                            ? 'text-green-600'
                            : job.status === 'closed'
                            ? 'text-red-500'
                            : job.status === 'draft'
                            ? 'text-yellow-700'
                            : job.status === 'archived'
                            ? 'text-gray-600'
                            : 'text-blue-800'
                          }`}
                      >
                        {toTitleCase(job.status)}
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
