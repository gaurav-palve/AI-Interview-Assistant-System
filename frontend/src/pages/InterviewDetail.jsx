import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import interviewService from '../services/interviewService';

// Material UI Icons
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
  Person as PersonIcon,
  Work as JobIcon,
  Email as EmailIcon,
  Event as EventIcon,
  Error as ErrorIcon,
  Upload as UploadIcon,
  QuestionAnswer as MCQIcon
} from '@mui/icons-material';

/**
 * InterviewDetail page component
 * Shows detailed information about a specific interview
 */
function InterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch interview details on component mount
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        const data = await interviewService.getInterviewById(id);
        setInterview(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching interview:', err);
        setError(err.detail || 'Failed to load interview details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id]);

  /**
   * Handle interview deletion
   */
  const handleDeleteInterview = async () => {
    if (window.confirm('Are you sure you want to delete this interview? This action cannot be undone.')) {
      try {
        await interviewService.deleteInterview(id);
        navigate('/interviews');
      } catch (err) {
        console.error('Error deleting interview:', err);
        setError(err.detail || 'Failed to delete interview. Please try again later.');
      }
    }
  };

  /**
   * Get status badge based on interview status
   * @param {string} status - Interview status
   * @returns {JSX.Element} - Status badge component
   */
  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <ScheduleIcon className="h-4 w-4 mr-1" />
            Scheduled
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CompletedIcon className="h-4 w-4 mr-1" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <CancelledIcon className="h-4 w-4 mr-1" />
            Cancelled
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <ScheduleIcon className="h-4 w-4 mr-1" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            Draft
          </span>
        );
    }
  };

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date string
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate('/interviews')}
            className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ArrowBackIcon className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Interview Details</h1>
        </div>
        {interview && (
          <div className="flex space-x-2">
            <Link
              to={`/interviews/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <EditIcon className="-ml-1 mr-2 h-5 w-5" />
              Edit
            </Link>
            <button
              type="button"
              onClick={handleDeleteInterview}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <DeleteIcon className="-ml-1 mr-2 h-5 w-5" />
              Delete
            </button>
          </div>
        )}
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
      ) : interview ? (
        <div className="space-y-6">
          {/* Interview Header */}
          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <JobIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{interview.job_role}</h2>
                </div>
                <div className="flex items-center text-gray-500 dark:text-gray-400 mb-4">
                  <PersonIcon className="h-5 w-5 mr-1" />
                  <span className="mr-4">{interview.candidate_name}</span>
                  <EmailIcon className="h-5 w-5 mr-1" />
                  <span>{interview.candidate_email}</span>
                </div>
                <div className="flex items-center">
                  <EventIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Scheduled for: {formatDate(interview.scheduled_datetime)}
                  </span>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                {getStatusBadge(interview.status)}
              </div>
            </div>
          </div>

          {/* Interview Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Status */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">File Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UploadIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">Resume</span>
                  </div>
                  {interview.resume_uploaded ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Uploaded
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Not Uploaded
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UploadIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">Job Description</span>
                  </div>
                  {interview.jd_uploaded ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Uploaded
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Not Uploaded
                    </span>
                  )}
                </div>
                {(!interview.resume_uploaded || !interview.jd_uploaded) && (
                  <div className="mt-4">
                    <Link
                      to={`/upload?email=${encodeURIComponent(interview.candidate_email)}`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <UploadIcon className="h-4 w-4 mr-1" />
                      Upload Files
                    </Link>
                  </div>
                )}
                {interview.resume_uploaded && interview.jd_uploaded && (
                  <div className="mt-4">
                    <Link
                      to={`/mcq?email=${encodeURIComponent(interview.candidate_email)}`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
                    >
                      <MCQIcon className="h-4 w-4 mr-1" />
                      Generate MCQs
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Interview Metadata</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Created At:</span>
                  <span className="text-gray-900 dark:text-white">{formatDate(interview.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                  <span className="text-gray-900 dark:text-white">{formatDate(interview.updated_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Interview ID:</span>
                  <span className="text-gray-900 dark:text-white font-mono text-sm">{interview.id}</span>
                </div>
                {interview.metadata && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
                    {interview.metadata.total_questions !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Total Questions:</span>
                        <span className="text-gray-900 dark:text-white">{interview.metadata.total_questions}</span>
                      </div>
                    )}
                    {interview.metadata.estimated_difficulty && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Estimated Difficulty:</span>
                        <span className="text-gray-900 dark:text-white capitalize">{interview.metadata.estimated_difficulty}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            <Link
              to={`/interviews/${id}/edit`}
              className="btn btn-primary"
            >
              <EditIcon className="h-5 w-5 mr-1" />
              Edit Interview
            </Link>
            <Link
              to={`/upload?email=${encodeURIComponent(interview.candidate_email)}`}
              className="btn btn-secondary"
            >
              <UploadIcon className="h-5 w-5 mr-1" />
              Manage Files
            </Link>
            <Link
              to={`/mcq?email=${encodeURIComponent(interview.candidate_email)}`}
              className="btn btn-outline"
            >
              <MCQIcon className="h-5 w-5 mr-1" />
              Generate MCQs
            </Link>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">Interview not found.</p>
          <Link
            to="/interviews"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowBackIcon className="-ml-1 mr-2 h-5 w-5" />
            Back to Interviews
          </Link>
        </div>
      )}
    </div>
  );
}

export default InterviewDetail;