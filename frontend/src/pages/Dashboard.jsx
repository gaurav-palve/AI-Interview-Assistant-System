import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import jobPostingService from '../services/jobPostingService';
import interviewService from '../services/interviewService';
import StatCard from '../components/Dashboard/StatCard';
import JobStatisticsTable from '../components/JobStatisticsTable/JobStatisticsTable';
import { Doughnut, Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { PERMISSIONS } from "../constants/permissions";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

// Material UI Icons
import {
  WorkOutline as JobIcon,
  Assignment as AssignmentIcon,
  PeopleOutline as PeopleIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  PersonOutlined,
  PostAddOutlined,
  FactCheckOutlined,
} from '@mui/icons-material';
import RecordVoiceOverOutlinedIcon from '@mui/icons-material/RecordVoiceOverOutlined';


ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  ChartDataLabels
);

/* ------------------- Donut Presets ------------------- */

// Empty donut chart data structure
const EMPTY_DONUT = {
  labels: [],
  datasets: [
    {
      data: [],
      backgroundColor: [],
    },
  ],
};
const buildInterviewDonut = (stats) => ({
  labels: ['Scheduled', 'Completed', 'In Progress', 'Cancelled', 'Draft'],
  datasets: [
    {
      data: [
        stats?.status_breakdown?.scheduled || 0,
        stats?.status_breakdown?.completed || 0,
        stats?.status_breakdown?.in_progress || 0,
        stats?.status_breakdown?.cancelled || 0,
        stats?.status_breakdown?.draft || 0,
      ],
      backgroundColor: [
        'rgba(54, 162, 235, 0.6)',
        'rgba(34, 197, 94, 0.6)',
        'rgba(234, 179, 8, 0.6)',
        'rgba(239, 68, 68, 0.6)',
        'rgba(156, 163, 175, 0.6)',
      ],
    },
  ],
});

// For job statistics - donut chart
const buildJobDonut = (stats) => ({
  labels: ['Active', 'Draft', 'Closed', 'Archived'],
  datasets: [
    {
      data: [
        stats?.active || 0,
        stats?.draft || 0,
        stats?.closed || 0,
        stats?.archived || 0,
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.6)',  // Green for active
        'rgba(251, 192, 45, 0.85)',  // Yellow for draft
        'rgba(239, 68, 68, 0.6)',   // Red for closed
        'rgba(107, 114, 128, 0.6)',  // Dark gray for archived
      ],
    },
  ],
});
// For user-role statistics - donut chart
const buildRoleDonut = (stats) => {
  // Extract role names and counts
  const roleNames = stats?.role_wise_users?.map(role => role.role_name) || [];
  const roleCounts = stats?.role_wise_users?.map(role => role.count) || [];

  // Generate colors dynamically based on number of roles
  const backgroundColors = roleNames.map((_, index) => {
    const hue = (index * 137) % 360; // Golden ratio to distribute colors
    return `hsla(${hue}, 70%, 60%, 0.6)`;
  });

  return {
    labels: roleNames,
    datasets: [
      {
        data: roleCounts,
        backgroundColor: backgroundColors,
      },
    ],
  };
};

// For role statistics - donut chart
const buildRoleStatsDonut = (stats) => {
  // Extract role names and counts
  const roleNames = stats?.roles?.map(role => role.role) || [];
  const roleCounts = stats?.roles?.map(role => role.count) || [];

  // Generate colors dynamically based on number of roles
  const backgroundColors = roleNames.map((_, index) => {
    const hue = (index * 137) % 360; // Golden ratio to distribute colors
    return `hsla(${hue}, 70%, 60%, 0.6)`;
  });

  return {
    labels: roleNames,
    datasets: [
      {
        data: roleCounts,
        backgroundColor: backgroundColors,
      },
    ],
  };
};

// For interview statistics from dashboard stats - donut chart
const buildInterviewStatsDonut = (stats) => ({
  labels: ['Scheduled', 'In Progress', 'Completed', 'Draft'],
  datasets: [
    {
      data: [
        stats?.scheduled_count || 0,
        stats?.in_progress_count || 0,
        stats?.completed_count || 0,
        stats?.draft_count || 0,
      ],
      backgroundColor: [
        'rgba(54, 162, 235, 0.6)',  // Blue for scheduled
        'rgba(234, 179, 8, 0.6)',   // Yellow for in progress
        'rgba(34, 197, 94, 0.6)',   // Green for completed
        'rgba(156, 163, 175, 0.6)', // Gray for draft
      ],
    },
  ],
});

// For user statistics - donut chart
const buildUserStatsDonut = (stats) => ({
  labels: ['Active Users', 'Inactive Users'],
  datasets: [
    {
      data: [
        stats?.active_users || 0,
        stats?.inactive_users || 0,
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.6)',  // Green for active
        'rgba(239, 68, 68, 0.6)',   // Red for inactive
      ],
    },
  ],
});

function Dashboard() {
  const { user, hasPermission, loading } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isTAAdmin = user?.role === "TA Admin" || user?.role === "TA LEAD";

  const [dashboardStats, setDashboardStats] = useState({
    totalJobPostings: 0,
    activeJobs: 0,
    rolesUsers: { roles: 0, users: 0 },
    interviews: { total: 0, completed: 0 },
  });

  const [activeMetric, setActiveMetric] = useState('roles');
  const [chartData, setChartData] = useState(EMPTY_DONUT);
  const [currentWeek, setCurrentWeek] = useState([]);

  const [scheduleEvents] = useState([
    { id: 1, title: 'Job Role Name', candidate: 'Gaurav Palve', time: '11:00AM - 12:00PM' },
    { id: 2, title: 'Job Role Name', candidate: 'Aakankhsa Bhavsar', time: '11:00AM - 12:00PM' }
  ]);

  const sidebarMetrics = ['Roles', 'Users', 'Jobs', 'Interviews'];

  /* ------------------- Week Logic ------------------- */

  const calculateWeek = (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  useEffect(() => {
    setCurrentWeek(calculateWeek(new Date()));

    // Fetch initial data
    const fetchInitialData = async () => {
      try {
        // Fetch interview stats for the chart
        // Fetch role stats for the chart (default view)
        const roleStats = await interviewService.getRoleStatistics();
        setChartData(buildRoleStatsDonut(roleStats));

        // ✅ Fetch interview stats (USED BELOW)
        const interviewStats = await interviewService.getInterviewsStats();



        // Fetch job stats for the dashboard cards
        const jobStats = await interviewService.getJobStatistics();

        // Fetch user-role stats for the dashboard cards
        const userRoleStats = await interviewService.getUserRoleStatistics();

        // Update dashboard stats
        setDashboardStats({
          totalJobPostings: jobStats.total || 0,
          activeJobs: jobStats.active || 0,
          rolesUsers: {
            roles: userRoleStats.total_roles || 0,
            users: userRoleStats.total_users || 0
          },
          interviews: {
            total: interviewStats.total_interviews || 0,
            completed: interviewStats.completed_count || 0
          }
        });
      } catch (err) {
        console.error('Error fetching initial dashboard data:', err);
      }
    };

    fetchInitialData();
  }, []);

  const changeWeek = (direction) => {
    const newDate = new Date(currentWeek[0]);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentWeek(calculateWeek(newDate));
  };

  /* ------------------- Metric Click Handler ------------------- */

  const handleMetricSelection = async (metric) => {
    setActiveMetric(metric);

    try {
      if (metric === 'interviews') {
        const res = await interviewService.getInterviewsStats();
        setChartData(buildInterviewStatsDonut(res));

        // Update dashboard stats with the latest interview data
        setDashboardStats(prevStats => ({
          ...prevStats,
          interviews: {
            total: res.total_interviews || 0,
            completed: res.completed_count || 0
          }
        }));
      }
      else if (metric === 'jobs') {
        const res = await interviewService.getJobStatistics();
        setChartData(buildJobDonut(res));

        // Update dashboard stats with the latest data
        setDashboardStats(prevStats => ({
          ...prevStats,
          totalJobPostings: res.total || 0,
          activeJobs: res.active || 0,
        }));
      }
      else if (metric === 'roles') {
        // Use the new method to fetch role statistics
        const res = await interviewService.getRoleStatistics();
        setChartData(buildRoleStatsDonut(res));
      }
      else if (metric === 'users') {
        // Use the new method to fetch user statistics
        const res = await interviewService.getUserStatistics();
        setChartData(buildUserStatsDonut(res));

        // Update dashboard stats with the latest data
        setDashboardStats(prevStats => ({
          ...prevStats,
          rolesUsers: {
            ...prevStats.rolesUsers,
            users: res.total_users || 0
          },
        }));
      }
      else if (metric === 'roles & users') {
        const res = await interviewService.getUserRoleStatistics();
        setChartData(buildRoleDonut(res));

        // Update dashboard stats with the latest data
        setDashboardStats(prevStats => ({
          ...prevStats,
          rolesUsers: {
            roles: res.total_roles || 0,
            users: res.total_users || 0
          },
        }));
      }
      else {
        setChartData(EMPTY_DONUT);
      }
    } catch (err) {
      console.error(`Error fetching ${metric} statistics:`, err);
      setChartData(EMPTY_DONUT);
    }
  };

  return (
    <div className="px-6 py-6 space-y-6 ">

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(isSuperAdmin || isTAAdmin) && (
          <StatCard
            icon={<PostAddOutlined className="text-white" />}
            count={dashboardStats.totalJobPostings}
            label="Total Job Posting"
            backgroundColor="bg-[#2563EB]"
            textColor="text-white"
            onClick={() => navigate('/job-postings')}
          />
        )}

        {(isSuperAdmin || isTAAdmin) && (
          <StatCard
            icon={<FactCheckOutlined />}
            count={dashboardStats.activeJobs}
            label="Total Active Jobs"
            backgroundColor="bg-white"
            textColor="text-black"
            onClick={() => navigate('/job-postings', { state: { filterActive: true } })}
          />
        )}

        {isSuperAdmin && (
          <StatCard icon={<PeopleIcon />} count={`${dashboardStats.rolesUsers.roles}/${dashboardStats.rolesUsers.users}`} label="Roles / Users" backgroundColor="bg-white" textColor="text-black" />
        )}

        {(isSuperAdmin || isTAAdmin) && (
          <StatCard icon={<RecordVoiceOverOutlinedIcon />} count="0/0" label="Interviews / Completed" backgroundColor="bg-white" textColor="text-black" hasArrow />
        )}

        {isTAAdmin && (
          <StatCard icon={<JobIcon />} count="35" label="Resumes Uploaded" backgroundColor="bg-white" textColor="text-black" hasArrow />
        )}


      </div>

      {/* Main Section */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Metrics + Donut */}
        <div className="bg-white rounded-lg shadow-sm flex flex-col md:flex-row gap-4 w-full md:w-2/3 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-full md:w-1/3 flex flex-row md:flex-col border-b md:border-b-0 md:border-r border-gray-200">
            {sidebarMetrics.map((metric, index) => (
              <button
                key={metric}
                onClick={() => handleMetricSelection(metric.toLowerCase())}
                className={`flex-1 w-full px-3 py-2 text-center flex items-center justify-center md:justify-between text-sm
        ${activeMetric === metric.toLowerCase()
                    ? `border-2 border-[#2563EB] border-b-2 text-[#2563EB] z-10
                      ${index === 0 ? 'rounded-tl-lg' : ''}
                      ${index === sidebarMetrics.length - 1 ? 'rounded-bl-lg' : ''}`
                    : 'text-gray-700 hover:bg-gray-50'}
        ${index !== sidebarMetrics.length - 1 && activeMetric !== metric.toLowerCase()
  ? 'border-b border-gray-200'
  : ''}
      `}
              >
                <span className="px-2 flex-1 text-left">{metric}</span>

                {activeMetric === metric.toLowerCase() && (
                  <ArrowForwardIcon fontSize="small" />
                )}
              </button>
            ))}
          </div>


          <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 px-4 py-4">
            {/* Donut */}
            <div className="flex justify-center items-center">
              <div className="w-[120px] sm:w-[160px] md:w-[220px] aspect-square">
                <Doughnut
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false, // 🔥 KEY FIX
                    cutout: '65%',
                    plugins: {
                      legend: { display: false },
                      datalabels: {
                        color: '#fff',
                        font: {
                          weight: 'bold',
                          size: 12,
                        },
                        formatter: (value) => (value > 0 ? value : ''),
                      },
                    },
                  }}
                />
              </div>
            </div>


            {/* Custom Legend */}
            <div className="flex flex-wrap md:flex-col gap-2 justify-center md:justify-center text-xs sm:text-sm">
              {chartData.labels?.map((label, index) => (
                <div
                  key={label}
                  className="flex items-center gap-2 min-w-[120px] text-gray-700"
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        chartData.datasets[0].backgroundColor[index],
                    }}
                  />
                  <span className="truncate">{label}</span>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Schedule */}
        <div className="bg-white p-4 rounded-lg shadow-sm w-full md:w-1/3">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Schedule</h3>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between my-4">
            <ArrowBackIcon className="cursor-pointer" onClick={() => changeWeek(-1)} />
            <span className="text-sm">
              {currentWeek.length > 0 &&
                `${currentWeek[0].toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - 
         ${currentWeek[6].toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            </span>
            <ArrowForwardIcon className="cursor-pointer" onClick={() => changeWeek(1)} />
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-xs text-[#333333]">
                {day}
              </div>
            ))}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {currentWeek.map((date, index) => (
              <div key={index} className="text-center">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto flex items-center justify-center rounded-full text-xs sm:text-sm
            ${date.toDateString() === new Date().toDateString()
                      ? 'text-white bg-[#2563EB]'
                      : 'text-[#B7B7B7] hover:bg-gray-100'}
          `}
                >
                  {date.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-3" />


          {/* Events */}
          <div className="space-y-3">
            {scheduleEvents.map(event => (
              <div key={event.id} className="bg-gray-50 p-2 sm:p-3 rounded-lg border-l-4 border-[#2563EB]" >
                <p className="font-medium text-sm">{event.title}</p>
                <p className="text-xs text-[#2563EB]">{event.candidate}</p>
                <p className="text-xs text-gray-500">{event.time}</p>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <JobStatisticsTable />
      </div>

    </div>
  );
}

export default Dashboard;
