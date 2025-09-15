import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Material UI Icons
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Add as AddIcon,
  BarChart as StatsIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Psychology as PsychologyIcon,
  Notifications as NotificationsIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

/**
 * MainLayout component for the application
 * Includes navigation sidebar and header
 */
function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [greeting, setGreeting] = useState('Hello');
  const [notificationCount, setNotificationCount] = useState(3);

  // Navigation items
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/interviews', label: 'Interviews', icon: <AssignmentIcon /> },
    // { path: '/interviews/new', label: 'New Interview', icon: <AddIcon /> },
    { path: '/statistics', label: 'Statistics', icon: <StatsIcon /> },
    { path: '/resume-screening', label: 'Resume Screening', icon: <AssessmentIcon /> },
    { path: '/job-description-generator', label: 'Job Description Generator', icon: <DescriptionIcon /> },
  ];

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Ensure light mode is set
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    
    // Animation for greeting text
    const interval = setInterval(() => {
      const greetings = ['Hello', 'Welcome', 'Hi there'];
      setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-gradient-to-b from-primary-600 to-primary-700">
            <div className="flex items-center h-20 flex-shrink-0 px-4 bg-primary-700">
              <Link to="/dashboard" className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mr-3 shadow-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-700 animate-pulse"></div>
                  <div className="absolute -inset-1 bg-white opacity-0 group-hover:opacity-10 rounded-full animate-ping"></div>
                  <PsychologyIcon className="h-6 w-6 text-primary-600 animate-pulse-slow transform group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-primary-400 rounded-full animate-ping absolute"></div>
                    <div className="w-1 h-1 bg-primary-400 rounded-full animate-ping absolute" style={{ animationDelay: '0.5s', left: '60%', top: '30%' }}></div>
                    <div className="w-1 h-1 bg-primary-400 rounded-full animate-ping absolute" style={{ animationDelay: '1s', left: '30%', top: '60%' }}></div>
                  </div>
                </div>
                <span className="text-white text-xl font-bold font-display animate-fadeIn animate-sparkle">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 relative">
                    <span className="absolute top-0 left-0 w-full h-full flex items-center justify-center overflow-hidden">
                      <span className="w-1 h-1 bg-white rounded-full animate-ping absolute" style={{ left: '10%', top: '20%', animationDelay: '0.2s' }}></span>
                      <span className="w-1 h-1 bg-white rounded-full animate-ping absolute" style={{ left: '80%', top: '50%', animationDelay: '0.7s' }}></span>
                      <span className="w-1 h-1 bg-white rounded-full animate-ping absolute" style={{ left: '30%', top: '70%', animationDelay: '1.2s' }}></span>
                    </span>
                    Interview Assistant
                  </span>
                </span>
              </Link>
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sidebar-link group ${
                      location.pathname === item.path
                        ? 'sidebar-link-active'
                        : 'sidebar-link-inactive'
                    }`}
                  >
                    <span className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="p-4 border-t border-primary-500/50">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-lg">
                      <PersonIcon />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{user?.email?.split('@')[0]}</p>
                    <button
                      onClick={handleLogout}
                      className="text-xs font-medium text-primary-200 hover:text-white flex items-center transition-colors mt-1"
                    >
                      <LogoutIcon className="h-4 w-4 mr-1" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 flex z-40 md:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity duration-300 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={toggleSidebar}
        ></div>

        <div
          className={`relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-primary-600 to-primary-700 transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={toggleSidebar}
            >
              <span className="sr-only">Close sidebar</span>
              <CloseIcon className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-1 h-0 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4 py-5">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mr-3 shadow-lg animate-pulse-slow">
                <PsychologyIcon className="h-6 w-6 text-primary-600" />
              </div>
              <span className="text-white text-xl font-bold font-display">Interview Assistant</span>
            </div>
            
            <nav className="mt-5 px-2 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-link group ${
                    location.pathname === item.path
                      ? 'sidebar-link-active'
                      : 'sidebar-link-inactive'
                  }`}
                  onClick={toggleSidebar}
                >
                  <span className="mr-4 h-6 w-6 group-hover:scale-110 transition-transform">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex-shrink-0 flex border-t border-primary-500/50 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-lg">
                  <PersonIcon />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-base font-medium text-white">{user?.email?.split('@')[0]}</p>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-primary-200 hover:text-white flex items-center transition-colors mt-1"
                >
                  <LogoutIcon className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="sticky top-0 z-10 bg-white shadow-md">
          {/* Mobile header */}
          <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex items-center justify-between">
            <div className="flex items-center">
              <button
                className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={toggleSidebar}
              >
                <span className="sr-only">Open sidebar</span>
                <MenuIcon className="h-6 w-6" />
              </button>
              <h1 className="text-base font-semibold text-gray-700 ml-2 font-serif" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                {greeting}, <span className="font-bold text-gray-900">{user?.email?.split('@')[0]}</span>
              </h1>
            </div>
          </div>
          
          {/* Desktop header */}
          <div className="hidden md:flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-700 font-serif" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                {greeting}, <span className="font-bold text-gray-900">{user?.email?.split('@')[0]}</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* New Interview button */}
              <Link
                to="/interviews/new"
                className="btn btn-primary rounded-full animate-lightning border border-primary-300"
              >
                <AddIcon className="-ml-1 mr-2 h-5 w-5 animate-pulse-slow" />
                New Interview
              </Link>
              
              {/* Notification icon */}
              <div className="relative">
                <button className="p-2 rounded-full text-gray-600 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200">
                  <NotificationsIcon className="h-6 w-6" />
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-xs text-white font-bold flex items-center justify-center transform translate-x-1 -translate-y-1 animate-pulse-slow">
                      {notificationCount}
                    </span>
                  )}
                </button>
              </div>
              
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none animate-fadeIn bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
