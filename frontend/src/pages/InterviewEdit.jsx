import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import interviewService from '../services/interviewService';
import { format } from 'date-fns';

// Material UI Icons
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

/**
 * InterviewEdit page component
 * Form for editing an existing interview
 */
function InterviewEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  const [interview, setInterview] = useState(null);
  
  // Initialize react-hook-form
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  // Fetch interview details on component mount
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setIsFetching(true);
        const data = await interviewService.getInterviewById(id);
        setInterview(data);
        
        // Format the date for the datetime-local input
        const scheduledDate = new Date(data.scheduled_datetime);
        const formattedDate = format(scheduledDate, "yyyy-MM-dd'T'HH:mm");
        
        // Reset form with interview data
        reset({
          candidate_name: data.candidate_name,
          candidate_email: data.candidate_email,
          job_role: data.job_role,
          scheduled_datetime: formattedDate,
          timezone: data.timezone || 'UTC', // Use the stored timezone or default to UTC
          status: data.status
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching interview:', err);
        setError(err.detail || 'Failed to load interview details. Please try again later.');
      } finally {
        setIsFetching(false);
      }
    };

    fetchInterview();
  }, [id, reset]);

  /**
   * Handle form submission
   * @param {Object} data - Form data
   */
  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a date object from the input (in local timezone)
      const localDate = new Date(data.scheduled_datetime);
      
      // Calculate the offset between local timezone and selected timezone
      const selectedTimezoneOffset = getTimezoneOffset(data.timezone);
      const localTimezoneOffset = new Date().getTimezoneOffset() * -1;
      const offsetDiff = selectedTimezoneOffset - localTimezoneOffset;
      
      // Adjust the date by the offset difference
      const scheduledDate = new Date(localDate.getTime() - offsetDiff * 60000);
      
      console.log('Local date:', localDate);
      console.log('Selected timezone:', data.timezone);
      console.log('Selected timezone offset:', selectedTimezoneOffset);
      console.log('Local timezone offset:', localTimezoneOffset);
      console.log('Offset difference:', offsetDiff);
      console.log('Adjusted date:', scheduledDate);
      
      // Create the interview update data object
      const updateData = {
        candidate_name: data.candidate_name,
        candidate_email: data.candidate_email,
        job_role: data.job_role,
        scheduled_datetime: scheduledDate,
        timezone: data.timezone,
        status: data.status
      };
      
      // Call the API to update the interview
      await interviewService.updateInterview(id, updateData);
      
      // Navigate back to the interview detail page
      navigate(`/interviews/${id}`);
    } catch (err) {
      console.error('Error updating interview:', err);
      setError(err.detail || 'Failed to update interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate(`/interviews/${id}`)}
            className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ArrowBackIcon className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Interview</h1>
        </div>
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

      {isFetching ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : interview ? (
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Candidate Name */}
              <div className="sm:col-span-3">
                <label htmlFor="candidate_name" className="form-label">
                  Candidate Name
                </label>
                <input
                  type="text"
                  id="candidate_name"
                  {...register('candidate_name', { 
                    required: 'Candidate name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  className={`form-input ${errors.candidate_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.candidate_name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.candidate_name.message}</p>
                )}
              </div>

              {/* Candidate Email */}
              <div className="sm:col-span-3">
                <label htmlFor="candidate_email" className="form-label">
                  Candidate Email
                </label>
                <input
                  type="email"
                  id="candidate_email"
                  {...register('candidate_email', { 
                    required: 'Candidate email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className={`form-input ${errors.candidate_email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.candidate_email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.candidate_email.message}</p>
                )}
              </div>

              {/* Job Role */}
              <div className="sm:col-span-6">
                <label htmlFor="job_role" className="form-label">
                  Job Role
                </label>
                <input
                  type="text"
                  id="job_role"
                  {...register('job_role', { 
                    required: 'Job role is required',
                    minLength: { value: 3, message: 'Job role must be at least 3 characters' }
                  })}
                  className={`form-input ${errors.job_role ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.job_role && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.job_role.message}</p>
                )}
              </div>

              {/* Scheduled Date and Time */}
              <div className="sm:col-span-3">
                <label htmlFor="scheduled_datetime" className="form-label">
                  Scheduled Date and Time
                </label>
                <input
                  type="datetime-local"
                  id="scheduled_datetime"
                  {...register('scheduled_datetime', { 
                    required: 'Scheduled date and time is required'
                  })}
                  className={`form-input ${errors.scheduled_datetime ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.scheduled_datetime && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.scheduled_datetime.message}</p>
                )}
              </div>

              {/* Status */}
              <div className="sm:col-span-3">
                <label htmlFor="status" className="form-label">
                  Status
                </label>
                <select
                  id="status"
                  {...register('status', { required: 'Status is required' })}
                  className={`form-input ${errors.status ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status.message}</p>
                )}
              </div>

              {/* Timezone */}
              <div className="sm:col-span-3">
                <label htmlFor="timezone" className="form-label">
                  Timezone
                </label>
                <select
                  id="timezone"
                  {...register('timezone', { required: 'Timezone is required' })}
                  className={`form-input ${errors.timezone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Anchorage">Alaska Time</option>
                  <option value="America/Adak">Hawaii-Aleutian Time</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Central European Time (CET)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                  <option value="Asia/Tokyo">Japan (JST)</option>
                  <option value="Asia/Shanghai">China (CST)</option>
                  <option value="Australia/Sydney">Australia Eastern Time</option>
                </select>
                {errors.timezone && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.timezone.message}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(`/interviews/${id}`)}
                className="btn btn-outline"
              >
                <CancelIcon className="h-5 w-5 mr-1" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <SaveIcon className="h-5 w-5 mr-1" />
                    Save Changes
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">Interview not found.</p>
          <button
            type="button"
            onClick={() => navigate('/interviews')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowBackIcon className="-ml-1 mr-2 h-5 w-5" />
            Back to Interviews
          </button>
        </div>
      )}
    </div>
  );
  /**
   * Get timezone offset in minutes
   * @param {string} timezone - Timezone identifier
   * @returns {number} - Timezone offset in minutes
   */
  function getTimezoneOffset(timezone) {
    try {
      const date = new Date();
      const options = { timeZone: timezone, timeZoneName: 'short' };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const timeZonePart = formatter.formatToParts(date)
        .find(part => part.type === 'timeZoneName');
      
      if (!timeZonePart) return 0;
      
      const timeZoneName = timeZonePart.value;
      
      // Parse the timezone offset from the name (e.g., "GMT+11")
      const match = timeZoneName.match(/GMT([+-])(\d+)(?::(\d+))?/);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        const hours = parseInt(match[2], 10);
        const minutes = match[3] ? parseInt(match[3], 10) : 0;
        return sign * (hours * 60 + minutes);
      }
      
      // Handle special cases
      if (timeZoneName === 'UTC') return 0;
      if (timeZoneName === 'EST') return -5 * 60;
      if (timeZoneName === 'CST') return -6 * 60;
      if (timeZoneName === 'MST') return -7 * 60;
      if (timeZoneName === 'PST') return -8 * 60;
      
      // Default to UTC if parsing fails
      return 0;
    } catch (error) {
      console.error('Error getting timezone offset:', error);
      return 0;
    }
  }
}

export default InterviewEdit;