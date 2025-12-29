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
  Drafts as DraftIcon,
  Cancel as CancelledIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  WorkOutlined,
  CheckCircleOutline,
  Cancel as CancelIcon,
  ArchiveOutlined,
  PeopleOutlined,
  SecurityOutlined,
  PersonOutline
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
  const [jobsStats, setJobsStats] = useState({
  totalJobs: 0,
  activeJobs: 0,
  draftJobs: 0,
  closedJobs: 0,
  archivedJobs: 0,
  });
  const [userRoleStats, setUserRoleStats] = useState({
  totalUsers: 0,
  totalRoles: 0,
  roleWise: []
  });



  // Fetch interviews and stats on component mount
  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);


  useEffect(() => {
    const loadUserRoleStats = async () => {
      try {
        const res = await interviewService.getUserRoleStatistics();

        setUserRoleStats({
          totalUsers: res.total_users,
          totalRoles: res.total_roles,
          roleWise: res.role_wise_users
        });
      } catch (err) {
        console.error("Failed to load user role stats", err);
      }
    };

    loadUserRoleStats();
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

        // Fetch jobs stats
        const jobsResponse = await interviewService.getJobsStatistics();
        setJobsStats({
          totalJobs: jobsResponse.total || 0,
          activeJobs: jobsResponse.active || 0,
          draftJobs: jobsResponse.draft || 0,
          closedJobs: jobsResponse.closed || 0,
          archivedJobs: jobsResponse.archived || 0,
        });
        
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
          // <span className="badge bg-gray-100 text-gray-800">
          //   Draft
          // </span>

<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <DraftIcon className= "h-3 w-3 mr-1" />
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
  {/* Welcome Header */}
  <div className="p-8 text-white">
    <div>
      
      <p className="text-black/90 text-lg opacity-90">
        Welcome back to your interview management dashboard
      </p>
    </div>
  </div>
      {/* ================= JOB STATISTICS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">

        {/* Total Jobs */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Total Jobs</p>
            <p className="text-2xl font-bold text-gray-900">{jobsStats.totalJobs}</p>
          </div>
          <WorkOutlined className="text-blue-600" />
        </div>

        {/* Active Jobs */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Active Jobs</p>
            <p className="text-2xl font-bold text-green-600">{jobsStats.activeJobs}</p>
          </div>
          <CheckCircleOutline className="text-green-600" />
        </div>

        {/* Draft Jobs */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Draft</p>
            <p className="text-2xl font-bold text-amber-600">{jobsStats.draftJobs}</p>
          </div>
          <DraftIcon className="text-amber-600" />
        </div>

        {/* Closed Jobs */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Closed</p>
            <p className="text-2xl font-bold text-red-600">{jobsStats.closedJobs}</p>
          </div>
          <CancelIcon className="text-red-600" />
        </div>

        {/* Archived Jobs */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Archived</p>
            <p className="text-2xl font-bold text-gray-600">{jobsStats.archivedJobs}</p>
          </div>
          <ArchiveOutlined className="text-gray-600" />
        </div>

      </div>

      {/* ================= USER & ROLE STATISTICS ================= */}
      <div className="space-y-6">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {userRoleStats.totalUsers}
              </p>
            </div>
            <PeopleOutlined className="text-blue-600" />
          </div>

          {/* Total Roles */}
          <div className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Roles</p>
              <p className="text-2xl font-bold text-purple-600">
                {userRoleStats.totalRoles}
              </p>
            </div>
            <SecurityOutlined className="text-purple-600" />
          </div>

        </div>

        {/* Role-wise User Count */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Users by Role
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userRoleStats.roleWise.map((role) => (
              <div
                key={role.role_id}
                className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition"
              >
                <div>
                  {/* ROLE NAME */}
                  <p className="text-sm font-medium text-gray-600">
                    {role.role_name}
                  </p>

                  {/* USER COUNT */}
                  <p className="text-xl font-bold text-gray-900">
                    {role.count}{" "}
                    <span className="text-sm font-medium text-gray-500">
                      
                    </span>
                  </p>
                </div>

                <PersonOutline className="text-gray-400" />
              </div>
            ))}
          </div>
        </div>


      </div>


      {error && (
        <div className="bg-danger-50 border-l-4 border-danger-500 p-4 rounded-xl animate-slideIn shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-danger-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-danger-700 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <Link
          to="/interviews/new"
          className="group relative overflow-hidden card flex flex-col items-center p-8 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 transition-all duration-500 hover:shadow-2xl rounded-2xl border border-gray-200 transform hover:-translate-y-3 hover:rotate-1 animate-fadeIn"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex-shrink-0 flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 mb-4 animate-pulse-slow">
              <AddIcon className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors duration-300 font-serif text-center mb-2">New Interview</h3>
            <p className="text-sm text-gray-500 text-center group-hover:text-gray-600 transition-colors">Schedule a new interview</p>
            <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <div className="flex items-center text-emerald-600 text-sm font-medium">
                <span>Get started</span>
                <svg className="ml-2 h-4 w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-200 to-teal-200 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-500 transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:-translate-y-0"></div>
        </Link>

        <Link
          to="/interviews"
          className="group relative overflow-hidden card flex flex-col items-center p-8 hover:bg-gradient-to-br hover:from-violet-50 hover:to-purple-50 transition-all duration-500 hover:shadow-2xl rounded-2xl border border-gray-200 transform hover:-translate-y-3 hover:-rotate-1 animate-fadeIn"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex-shrink-0 flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-xl group-hover:scale-125 group-hover:-rotate-12 transition-all duration-500 mb-4 animate-pulse-slow" style={{ animationDelay: '0.5s' }}>
              <AssignmentIcon className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-violet-600 transition-colors duration-300 font-serif text-center mb-2">Manage Interviews</h3>
            <p className="text-sm text-gray-500 text-center group-hover:text-gray-600 transition-colors">View and manage interviews</p>
            <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <div className="flex items-center text-violet-600 text-sm font-medium">
                <span>View all</span>
                <svg className="ml-2 h-4 w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-violet-200 to-purple-200 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-500 transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:-translate-y-0"></div>
        </Link>

        <Link
          to="/statistics"
          className="group relative overflow-hidden card flex flex-col items-center p-8 hover:bg-gradient-to-br hover:from-rose-50 hover:to-pink-50 transition-all duration-500 hover:shadow-2xl rounded-2xl border border-gray-200 transform hover:-translate-y-3 hover:rotate-1 animate-fadeIn"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex-shrink-0 flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 mb-4 animate-pulse-slow" style={{ animationDelay: '1s' }}>
              <StatsIcon className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-rose-600 transition-colors duration-300 font-serif text-center mb-2">Statistics</h3>
            <p className="text-sm text-gray-500 text-center group-hover:text-gray-600 transition-colors">View interview analytics</p>
            <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <div className="flex items-center text-rose-600 text-sm font-medium">
                <span>Analytics</span>
                <svg className="ml-2 h-4 w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-rose-200 to-pink-200 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-500 transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:-translate-y-0"></div>
        </Link>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="relative overflow-hidden card shadow-2xl border-t-4 border-indigo-500 animate-fadeIn hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-white to-gray-50" style={{ animationDelay: '0.4s' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center animate-slideInLeft">
                <div className="relative mr-3">
                  <StatsIcon className="h-8 w-8 text-indigo-600" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-gray-800 font-serif bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Your Statistics
                </span>
              </h2>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span>Live data</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="group relative overflow-hidden stats-card stats-card-primary flex flex-col items-center justify-center p-6 rounded-2xl hover:shadow-xl transition-all duration-500 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-indigo-100 animate-fadeIn transform hover:-translate-y-2 hover:scale-105" style={{ animationDelay: '0.5s' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 animate-pulse-slow">
                    <AssignmentIcon className="h-8 w-8" />
                  </div>
                  <p className="text-4xl font-bold text-gray-900 font-serif mb-1 group-hover:text-indigo-600 transition-colors duration-300">{stats.total_interviews || 0}</p>
                  <p className="text-sm font-semibold text-indigo-600 text-center">Total Interviews</p>
                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <div className="w-full bg-indigo-200 rounded-full h-1">
                      <div className="bg-indigo-500 h-1 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden stats-card stats-card-secondary flex flex-col items-center justify-center p-6 rounded-2xl hover:shadow-xl transition-all duration-500 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-emerald-100 animate-fadeIn transform hover:-translate-y-2 hover:scale-105" style={{ animationDelay: '0.6s' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white mb-4 shadow-lg group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 animate-pulse-slow" style={{ animationDelay: '0.5s' }}>
                    <ScheduleIcon className="h-8 w-8" />
                  </div>
                  <p className="text-4xl font-bold text-gray-900 font-serif mb-1 group-hover:text-emerald-600 transition-colors duration-300">{stats.status_breakdown?.scheduled || 0}</p>
                  <p className="text-sm font-semibold text-emerald-600 text-center">Scheduled</p>
                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <div className="w-full bg-emerald-200 rounded-full h-1">
                      <div className="bg-emerald-500 h-1 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden stats-card stats-card-accent flex flex-col items-center justify-center p-6 rounded-2xl hover:shadow-xl transition-all duration-500 hover:bg-gradient-to-br hover:from-rose-50 hover:to-rose-100 animate-fadeIn transform hover:-translate-y-2 hover:scale-105" style={{ animationDelay: '0.7s' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-rose-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-white mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 animate-pulse-slow" style={{ animationDelay: '1s' }}>
                    <CompletedIcon className="h-8 w-8" />
                  </div>
                  <p className="text-4xl font-bold text-gray-900 font-serif mb-1 group-hover:text-rose-600 transition-colors duration-300">{stats.status_breakdown?.completed || 0}</p>
                  <p className="text-sm font-semibold text-rose-600 text-center">Completed</p>
                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <div className="w-full bg-rose-200 rounded-full h-1">
                      <div className="bg-rose-500 h-1 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden stats-card stats-card-warning flex flex-col items-center justify-center p-6 rounded-2xl hover:shadow-xl transition-all duration-500 hover:bg-gradient-to-br hover:from-amber-50 hover:to-amber-100 animate-fadeIn transform hover:-translate-y-2 hover:scale-105" style={{ animationDelay: '0.8s' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white mb-4 shadow-lg group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 animate-pulse-slow" style={{ animationDelay: '1.5s' }}>
                    <PeopleIcon className="h-8 w-8" />
                  </div>
                  <p className="text-4xl font-bold text-gray-900 font-serif mb-1 group-hover:text-amber-600 transition-colors duration-300">{stats.status_breakdown?.draft || 0}</p>
                  <p className="text-sm font-semibold text-amber-600 text-center">Drafts</p>
                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <div className="w-full bg-amber-200 rounded-full h-1">
                      <div className="bg-amber-500 h-1 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Interviews */}
      <div className="relative overflow-hidden card shadow-2xl border-t-4 border-violet-500 animate-fadeIn hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-white to-gray-50" style={{ animationDelay: '0.9s' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-indigo-500/5"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold flex items-center animate-slideInLeft">
              <div className="relative mr-3">
                <TrendingUpIcon className="h-8 w-8 text-violet-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-gray-800 font-serif bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Recent Interviews
              </span>
            </h2>
            <Link
              to="/interviews"
              className="group flex items-center text-sm font-semibold text-violet-600 hover:text-violet-700 transition-all duration-300 hover:scale-105"
            >
              <span className="mr-2">View all</span>
              <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-primary-600 absolute top-0 left-0"></div>
              </div>
              <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading interviews...</p>
            </div>
          ) : interviews.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-inner">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th scope="col" className="table-header">
                      <div className="flex items-center">
                        <span>Candidate</span>
                        <svg className="ml-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </th>
                    <th scope="col" className="table-header">
                      <div className="flex items-center">
                        <span>Job Role</span>
                        <svg className="ml-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                      </div>
                    </th>
                    <th scope="col" className="table-header">
                      <div className="flex items-center">
                        <span>Scheduled Date</span>
                        <svg className="ml-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </th>
                    <th scope="col" className="table-header">
                      <div className="flex items-center">
                        <span>Status</span>
                        <svg className="ml-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </th>
                    <th scope="col" className="table-header text-right">
                      <div className="flex items-center justify-end">
                        <span>Actions</span>
                        <svg className="ml-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {interviews.map((interview, index) => (
                    <tr
                      key={interview.id}
                      className="group table-row hover:bg-gradient-to-r hover:from-violet-50 hover:to-indigo-50 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-sm"
                      style={{ animationDelay: `${1.0 + index * 0.1}s` }}
                    >
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-400 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                              {interview.candidate_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-violet-600 transition-colors duration-200">{interview.candidate_name}</div>
                            <div className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">{interview.candidate_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm font-medium text-gray-900 group-hover:text-emerald-600 transition-colors duration-200">{interview.job_role}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900 group-hover:text-rose-600 transition-colors duration-200">{formatDate(interview.scheduled_datetime)}</div>
                      </td>
                      <td className="table-cell">
                        <div className="transform transition-transform duration-200 group-hover:scale-110">
                          {getStatusBadge(interview.status)}
                        </div>
                      </td>
                      <td className="table-cell text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                          <Link
                            to={`/interviews/${interview.id}`}
                            className="p-2 text-violet-600 hover:text-violet-800 hover:bg-violet-100 rounded-lg transition-all duration-200 transform hover:scale-110"
                            title="View Interview"
                          >
                            <ViewIcon className="h-5 w-5" />
                          </Link>
                          <Link
                            to={`/interviews/${interview.id}/edit`}
                            className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-all duration-200 transform hover:scale-110"
                            title="Edit Interview"
                          >
                            <EditIcon className="h-5 w-5" />
                          </Link>
                        </div>
                        <div className="opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                          <Link
                            to={`/interviews/${interview.id}`}
                            className="text-violet-600 hover:text-violet-900 mr-4 transition-colors duration-200"
                          >
                            <ViewIcon className="h-5 w-5 inline" />
                          </Link>
                          <Link
                            to={`/interviews/${interview.id}/edit`}
                            className="text-emerald-600 hover:text-emerald-900 transition-colors duration-200"
                          >
                            <EditIcon className="h-5 w-5 inline" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="relative overflow-hidden py-16 text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-indigo-500/5"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-violet-200 to-indigo-300 text-violet-500 mb-6 animate-pulse-slow">
                  <AssignmentIcon className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-3">No interviews found</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Get started by creating your first interview. It's quick and easy to set up!</p>
                <Link
                  to="/interviews/new"
                  className="group btn btn-primary inline-flex items-center transform hover:scale-105 transition-all duration-300"
                >
                  <AddIcon className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                  Create First Interview
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
