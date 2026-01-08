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
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

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
        'rgba(156, 163, 175, 0.6)', // Gray for draft
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
  const { user, hasPermission, loading} = useAuth();
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

  const sidebarMetrics = ['Roles', 'Users', 'Jobs', 'Interviews',];

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight animate-slideInLeft">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(isSuperAdmin | isTAAdmin) && (
        <StatCard
          icon={<JobIcon className="text-white"/>}
          count={dashboardStats.totalJobPostings}
          label="Total Job Posting"
          backgroundColor="bg-black"
          textColor="text-white"
          onClick={() => navigate('/job-postings')}
        />
        )}

        {(isSuperAdmin | isTAAdmin) && (
        <StatCard
          icon={<JobIcon />}
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

        {isSuperAdmin | isTAAdmin && (
        <StatCard icon={<JobIcon />} count="0/0" label="Interviews / Completed" backgroundColor="bg-white" textColor="text-black" hasArrow />
        )}

        {/* {isTAAdmin && (
        <StatCard icon={<JobIcon />} count="35" label="Resumes Uploaded" backgroundColor="bg-white" textColor="text-black" hasArrow />
        )} */}

        
      </div>

      {/* Main Section */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Metrics + Donut */}
        <div className="bg-white p-6 rounded-lg shadow-sm flex gap-6 md:w-2/3">
          {/* Left Sidebar */}
          <div className="w-1/3 pr-4 space-y-2">
            {sidebarMetrics.map(metric => (
              <button
                key={metric}
                onClick={() => handleMetricSelection(metric.toLowerCase())}
                className={`w-full p-3 rounded-lg border text-left
                  ${activeMetric === metric.toLowerCase()
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white border-gray-200 hover:bg-gray-50'}
                `}
              >
                {metric}
              </button>
            ))}
          </div>

          <div className="w-2/3 flex items-center gap-10">
          {/* Donut */}
          <div className="w-[230px] h-[230px] flex-shrink-0">
            <Doughnut
              data={chartData}
              options={{
                cutout: '60%', // 👈 increases hole size → thinner outer ring
                plugins: {
                  legend: { display: false },
                  datalabels: {
                    color: '#fff',
                    font: {
                      weight: 'bold',
                      size: 20,
                    },
                    formatter: (value) => (value > 0 ? value : ''),
                  },
                },
                maintainAspectRatio: false,
              }}

            />
          </div>

          {/* Custom Legend */}
          <div className="ml-8 space-y-3">
            {chartData.labels?.map((label, index) => (
              <div key={label} className="flex items-center gap-3 text-sm text-gray-700">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      chartData.datasets[0].backgroundColor[index],
                  }}
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

        {/* Schedule */}
        <div className="bg-white p-4 rounded-lg shadow-sm md:w-1/3">
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
      <div key={day} className="text-center text-xs text-gray-500">
        {day}
      </div>
    ))}
  </div>

  {/* Dates */}
  <div className="grid grid-cols-7 gap-1 mb-4">
    {currentWeek.map((date, index) => (
      <div key={index} className="text-center">
        <div
          className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full
            ${date.toDateString() === new Date().toDateString()
              ? 'bg-blue-500 text-white'
              : 'text-gray-700 hover:bg-gray-100'}
          `}
        >
          {date.getDate()}
        </div>
      </div>
    ))}
  </div>

  Events
  <div className="space-y-3">
    {scheduleEvents.map(event => (
      <div
        key={event.id}
        className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500"
      >
        <p className="font-medium text-sm">{event.title}</p>
        <p className="text-xs text-blue-500">{event.candidate}</p>
        <p className="text-xs text-gray-500">{event.time}</p>
      </div>
    ))}
  </div>
</div>

      </div>

      {/* Table */}
      <JobStatisticsTable />
    </div>
  );
}

export default Dashboard;
