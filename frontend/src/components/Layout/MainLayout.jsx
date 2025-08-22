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
  Settings as SettingsIcon
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

  // Navigation items
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/interviews', label: 'Interviews', icon: <AssignmentIcon /> },
    { path: '/interviews/new', label: 'New Interview', icon: <AddIcon /> },
    { path: '/statistics', label: 'Statistics', icon: <StatsIcon /> },
    
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
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-gradient-to-b from-primary-600 to-primary-700">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-700">
              <Link to="/dashboard" className="flex items-center">
                <span className="text-white text-xl font-bold font-display">Interview Assistant</span>
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
                    <p className="text-sm font-medium text-white">{user?.email}</p>
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

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
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
                <p className="text-base font-medium text-white">{user?.email}</p>
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
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white shadow-md flex items-center justify-between">
          <div className="flex items-center">
            <button
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={toggleSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <MenuIcon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 ml-2 font-display">
              Interview Assistant
            </h1>
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