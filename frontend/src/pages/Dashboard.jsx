import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import jobPostingService from '../services/jobPostingService';
import interviewService from '../services/interviewService';
import StatCard from '../components/Dashboard/StatCard';
import JobStatisticsTable from '../components/JobStatisticsTable/JobStatisticsTable';
import { Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Material UI Icons
import {
  Work as JobIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
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

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardStats, setDashboardStats] = useState({
    totalJobPostings: 0,
    activeJobs: 0,
    rolesUsers: { roles: 0, users: 0 },
  });

  const [activeMetric, setActiveMetric] = useState('interviews');
  const [chartData, setChartData] = useState(EMPTY_DONUT);
  const [currentWeek, setCurrentWeek] = useState([]);

  const [scheduleEvents] = useState([
    { id: 1, title: 'Job Role Name', candidate: 'Gaurav Palve', time: '11:00AM - 12:00PM' },
    { id: 2, title: 'Job Role Name', candidate: 'Sumeet Patil', time: '11:00AM - 12:00PM' }
  ]);

  const sidebarMetrics = ['Interviews', 'Jobs', 'Roles', 'Users','Roles & Users'];

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
        const interviewStats = await interviewService.getInterviewStatistics();
        setChartData(buildInterviewDonut(interviewStats.data));
        
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
        const res = await interviewService.getInterviewStatistics();
        setChartData(buildInterviewDonut(res.data));
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
      else if (metric === 'roles' || metric === 'users') {
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

  /* ------------------- UI ------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<JobIcon />}
          count={dashboardStats.totalJobPostings}
          label="Total Job Posting"
          backgroundColor="bg-white"
          textColor="text-black"
          onClick={() => navigate('/job-postings')}
        />
        <StatCard
          icon={<JobIcon />}
          count={dashboardStats.activeJobs}
          label="Total Active Jobs"
          backgroundColor="bg-white"
          textColor="text-black"
          onClick={() => navigate('/job-postings', { state: { filterActive: true } })}
        />
        <StatCard icon={<PeopleIcon />} count={`${dashboardStats.rolesUsers.roles}/${dashboardStats.rolesUsers.users}`} label="Roles / Users" backgroundColor="bg-white" textColor="text-black" />
        <StatCard icon={<JobIcon />} count="20 / 10" label="Interviews / Completed" backgroundColor="bg-white" textColor="text-black" hasArrow />
      </div>

      {/* Main Section */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Metrics + Donut */}
        <div className="bg-white p-6 rounded-lg shadow-sm flex md:w-2/3">
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

          {/* Donut Chart */}
          <div className="w-2/3 flex justify-center items-center">
            <Doughnut
              data={chartData}
              options={{
                plugins: {
                  legend: {
                    display: true,
                    position: 'right',
                  },
                  datalabels: {
                    color: '#fff',
                    font: {
                      weight: 'bold',
                      size: 12,
                    },
                    formatter: (value) => {
                      return value > 0 ? value : '';
                    },
                  },
                },
                maintainAspectRatio: false,
              }}
            />

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

  {/* Events */}
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
