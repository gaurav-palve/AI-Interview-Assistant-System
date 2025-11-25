import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import interviewService from '../services/interviewService';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Material UI Icons
import {
  Add as AddIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  Drafts as DraftIcon,
  Cancel as CancelledIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Download as DownloadIcon
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
  
  // Added: Download loading state
  const [downloading, setDownloading] = useState(false);

  // Fetch interviews
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

  // Handle delete
  const handleDeleteInterview = async (interviewId) => {
    if (window.confirm('Are you sure you want to delete this interview?')) {
      try {
        await interviewService.deleteInterview(interviewId);
        const response = await interviewService.getInterviews(page, pageSize);
        setInterviews(response.interviews || []);
        setTotalPages(Math.ceil((response.total || 0) / pageSize));
        setTotalInterviews(response.total || 0);
      } catch (err) {
        console.error('Error deleting interview:', err);
        setError(err.detail || 'Failed to delete interview.');
        setTimeout(() => setError(null), 5000);
      }
    }
  };

  const handleDownloadAll = async () => {
    try {
      if (!interviews.length) {
        alert("No interviews to export");
        return;
      }

      // Prepare data for Excel
      const data = interviews.map((interview) => ({
        Candidate: interview.candidate_name,
        Email: interview.candidate_email,
        "Job Role": interview.job_role,
        "Scheduled Date": formatDate(interview.scheduled_datetime),
        Status: interview.status.charAt(0).toUpperCase() + interview.status.slice(1),
      }));

      // Create worksheet and workbook
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Interviews");

      // Generate Excel file and trigger download
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, "interviews.xlsx");

    } catch (error) {
      console.error("Excel export failed:", error);
      alert("Failed to export interviews to Excel");
    }
  };

  // Status badge
  const getStatusBadge = (status) => {
    const common = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'scheduled':
        return <span className={`${common} bg-blue-100 text-blue-800`}><ScheduleIcon className="h-3 w-3 mr-1" />Scheduled</span>;
      case 'completed':
        return <span className={`${common} bg-green-100 text-green-800`}><CompletedIcon className="h-3 w-3 mr-1" />Completed</span>;
      case 'cancelled':
        return <span className={`${common} bg-red-100 text-red-800`}><CancelledIcon className="h-3 w-3 mr-1" />Cancelled</span>;
      case 'in_progress':
        return <span className={`${common} bg-yellow-100 text-yellow-800`}><ScheduleIcon className="h-3 w-3 mr-1" />In Progress</span>;
      default:
        return <span className={`${common} bg-gray-100 text-gray-800`}><DraftIcon className="h-3 w-3 mr-1" />Draft</span>;
    }
  };

  // Date formatting
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Filter interviews
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary-500 font-serif animate-fadeIn">Interviews</h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Search & Filters */}
      <div className="card p-4 shadow-lg border-t-4 border-primary-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Search interviews..."
            />
          </div>

          <div className="flex items-center space-x-4">
            {/* Status Filter */}
            <div className="relative">
              <div className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[120px] flex items-center justify-between">
                <span>
                  {statusFilter === 'all'
                    ? 'All Statuses'
                    : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </span>
                <FilterIcon className="h-5 w-5 text-primary-500 ml-2" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value="all">All</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Page Size */}
            <div className="relative">
              <div className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[120px] flex items-center justify-between">
                <span>{pageSize} per page</span>
                <FilterIcon className="h-5 w-5 text-primary-500 ml-2" />
              </div>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

       {/* 🟩 Updated Button with loading */}
       <div className="flex justify-end">
        <button
          onClick={handleDownloadAll}
          disabled={downloading}
          className="inline-flex items-center px-5 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium shadow-md hover:scale-105 transition-all disabled:opacity-50"
        >
          <DownloadIcon className="mr-2" />
          {downloading ? 'Downloading...' : 'Download'}
        </button>

       </div>
        

      {/* Interviews Table */}
      <div className="card overflow-hidden shadow-lg border-t-4 border-secondary-500">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredInterviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Job Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Scheduled Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInterviews.map((interview) => (
                  <tr key={interview.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{interview.candidate_name}</div>
                      <div className="text-gray-500 text-sm">{interview.candidate_email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{interview.job_role}</td>
                    <td className="px-6 py-4 text-gray-700">{formatDate(interview.scheduled_datetime)}</td>
                    <td className="px-6 py-4">{getStatusBadge(interview.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/interviews/${interview.id}/edit`} className="text-secondary-600 hover:text-secondary-800 mr-3">
                        <EditIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteInterview(interview.id)}
                        className="text-red-600 hover:text-red-800"
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
          <div className="py-8 text-center text-gray-500">No interviews found.</div>
        )}

        {/* Pagination */}
        {filteredInterviews.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalInterviews)} of {totalInterviews}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-md border bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeftIcon />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-md border bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InterviewList;
