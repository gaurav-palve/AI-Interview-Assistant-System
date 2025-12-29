import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../pages/Logo';
import { PERMISSIONS } from "../../constants/permissions";
import { NAV_ITEMS, SETTINGS_MENU } from "../../config/navigationConfig";
 
import {
  MenuOutlined as MenuIcon,
  CloseOutlined as CloseIcon,
  NotificationsOutlined as NotificationsIcon,
  AddOutlined as AddIcon,
  PersonOutlined as PersonIcon,
  LogoutOutlined as LogoutIcon,
  DashboardOutlined as DashboardIcon,
  AssignmentOutlined as AssignmentIcon,
  BarChartOutlined as StatsIcon,
  AssessmentOutlined as AssessmentIcon,
  DescriptionOutlined as DescriptionIcon,
  GradingOutlined as GradingIcon,
  WorkOutlined as WorkIcon,
  ChevronLeftOutlined as ChevronLeftIcon,
  ChevronRightOutlined as ChevronRightIcon,
  AdminPanelSettingsOutlined as RolesIcon,
  SettingsOutlined,
  PersonAddOutlined,
  PeopleOutlined,
  AdminPanelSettingsOutlined
} from '@mui/icons-material';
 
export default function MainLayout({ children }) {
  // const { user, logout } = useAuth();
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
 
  const [isSidebarHovered, setSidebarHovered] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Desktop sidebar toggle state
  const [greeting, setGreeting] = useState('Hello');
  const [notificationCount, setNotificationCount] = useState(3);

  const [settingsOpen, setSettingsOpen] = useState(
  location.pathname.startsWith("/users") ||
  location.pathname.startsWith("/roles")
  );

  const canSeeSettings =
  hasPermission(PERMISSIONS.USER_VIEW) ||
  hasPermission(PERMISSIONS.USER_MANAGE) ||
  hasPermission(PERMISSIONS.ROLE_MANAGE);
 
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon />, permissions: [
      // PERMISSIONS.JOB_VIEW,
      PERMISSIONS.REPORT_VIEW,
      PERMISSIONS.USER_VIEW,
    ], },

    { path: '/job-postings', label: 'Job Postings', icon: <WorkIcon />, permissions: [
      PERMISSIONS.JOB_VIEW,
      PERMISSIONS.JOB_CREATE,
      PERMISSIONS.JOB_EDIT,
      PERMISSIONS.JOB_DELETE,
      PERMISSIONS.JOB_VIEW_ALL,
      PERMISSIONS.JOB_VIEW_ASSIGNED,
    ], },

    { path: '/interviews', label: 'Interviews', icon: <AssignmentIcon />, permissions: [
      PERMISSIONS.INTERVIEW_VIEW,
      PERMISSIONS.INTERVIEW_SCHEDULE,
      PERMISSIONS.INTERVIEW_MANAGE,
    ], },

    { path: '/statistics', label: 'Statistics', icon: <StatsIcon />, permissions: [
      PERMISSIONS.REPORT_VIEW,
    ], },

    { path: '/candidate-assessment-reports', label: 'Assessment Reports', icon: <GradingIcon />, permissions: [
      PERMISSIONS.ASSESSMENT_VIEW,
      PERMISSIONS.ASSESSMENT_CREATE,
    ], }
  ];
 
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
 
    const interval = setInterval(() => {
      const greetings = ['Hello', 'Welcome', 'Hi there'];
      setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
    }, 5000);
 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (
      location.pathname.startsWith("/users") ||
      location.pathname.startsWith("/create-role")
    ) {
      setSettingsOpen(true);
    } else {
      setSettingsOpen(false);
    }
  }, [location.pathname]);

 
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
 
  // Determine if sidebar should be visible (expanded or hovered)
  const isSidebarVisible = isSidebarExpanded || isSidebarHovered;
 
  return (
    <div className="flex h-screen w-full bg-gray-50 relative overflow-hidden" style={{ margin: 0, padding: 0 }}>
      {/* Hover zone for desktop - only active when sidebar is collapsed */}
      {!isSidebarExpanded && (
        <div
          className="hidden md:block fixed top-0 left-0 h-full w-3 z-50"
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
        />
      )}
 
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarVisible ? 'w-64' : 'w-16'
        } bg-gradient-to-b from-primary-700 via-primary-800 to-primary-900 shadow-2xl border-r border-primary-600/50`}
        style={{ margin: 0, padding: 0 }}
        onMouseEnter={() => !isSidebarExpanded && setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        <div className="flex flex-col w-full h-full">
          {/* Logo and Toggle Button */}
<div className="px-4 pt-4">
  <div className="flex items-center justify-between w-full h-10">
    {isSidebarVisible ? (
      <>
        <Link to="/dashboard" className="flex items-center justify-start flex-1 pl-2">
          <Logo expanded={isSidebarVisible} />
        </Link>
        {/* Professional Toggle Button - Top right of drawer when expanded */}
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-primary-700 shadow-lg border border-white/10"
          aria-label="Collapse sidebar"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      </>
    ) : (
      /* Toggle Button - Top left when collapsed */
      <button
        onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
        className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-primary-700 mx-auto shadow-lg border border-white/10"
        aria-label="Expand sidebar"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    )}
  </div>
 
  {/* Professional Divider */}
  <div className="mt-3 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
</div>
 
  <nav className="flex-1 px-2 py-4 space-y-2 overflow-hidden">
  {NAV_ITEMS.filter(item =>item.permissions.some(p => hasPermission(p))).map((item) => (
    <Link
      key={item.path}
      to={item.path}
      className={`flex items-center text-white/90 hover:text-white transition-all duration-200 ${
        location.pathname === item.path ? 'font-semibold' : 'font-normal'
      }`}
    >
      <div
        className={`h-11 w-full flex ${
          isSidebarVisible ? 'justify-start pl-3' : 'justify-center'
        } items-center rounded-lg transition-all duration-300 ${
          location.pathname === item.path
            ? 'bg-white/15 shadow-lg border-l-2 border-primary-400'
            : 'hover:bg-white/10 hover:shadow-md'
        }`}
      >
        <span className="h-6 w-6 flex-shrink-0 flex items-center justify-center"><item.icon /></span>
        <span
          className={`ml-3 whitespace-nowrap transition-all duration-300 ${
            isSidebarVisible
              ? 'opacity-100 max-w-[200px]'
              : 'opacity-0 max-w-0 overflow-hidden'
          }`}
        >
          {item.label}
        </span>
      </div>
    </Link>
  ))}
  {/* SETTINGS */}
  {canSeeSettings && (
  <div>
    <button
      onClick={() => setSettingsOpen(!settingsOpen)}
      className="flex items-center text-white/90 hover:text-white transition-all duration-200 w-full"
    >
      <div
        className={`h-11 w-full flex ${
          isSidebarVisible ? 'justify-start pl-3' : 'justify-center'
        } items-center rounded-lg transition-all duration-300 ${
          settingsOpen
            ? 'bg-white/15 shadow-lg border-l-2 border-primary-400'
            : 'hover:bg-white/10 hover:shadow-md'
        }`}
      >
        <span className="h-6 w-6 flex items-center justify-center">
          <SettingsOutlined />
        </span>

        <span
          className={`ml-3 whitespace-nowrap transition-all duration-300 ${
            isSidebarVisible
              ? 'opacity-100 max-w-[200px]'
              : 'opacity-0 max-w-0 overflow-hidden'
          }`}
        >
          Settings
        </span>
      </div>
    </button>

    {/* SETTINGS SUB MENU */}
    {settingsOpen && isSidebarVisible && (
      <div className="ml-6 mt-1 space-y-1">
        {/* Create User */}
        {hasPermission(PERMISSIONS.USER_MANAGE) && (
        <Link to="/users/create">
          <div
            className={`h-11 w-full flex items-center pl-3 rounded-lg transition-all duration-300
            text-white/80 hover:text-white
            ${
              location.pathname === '/users/create'
                ? 'bg-white/15 shadow-lg border-l-2 border-primary-400 font-semibold'
                : 'hover:bg-white/10 hover:shadow-md'
            }`}
          >
            <PersonAddOutlined fontSize="small" className="mr-2" />
            Create User
          </div>
        </Link>
        )}

        {/* Role Management */}
        {hasPermission(PERMISSIONS.ROLE_MANAGE) && (
        <Link to="/create-role">
          <div
            className={`h-11 w-full flex items-center pl-3 rounded-lg transition-all duration-300
            text-white/80 hover:text-white
            ${
              location.pathname === '/create-role'
                ? 'bg-white/15 shadow-lg border-l-2 border-primary-400 font-semibold'
                : 'hover:bg-white/10 hover:shadow-md'
            }`}
          >
            <AdminPanelSettingsOutlined fontSize="small" className="mr-2" />
            Role Management
          </div>
        </Link>
        )}

        {/* All Users */}
        {hasPermission(PERMISSIONS.USER_VIEW) && (
        <Link to="/users">
          <div
            className={`h-11 w-full flex items-center pl-3 rounded-lg transition-all duration-300
            text-white/80 hover:text-white
            ${
              location.pathname === '/users'
                ? 'bg-white/15 shadow-lg border-l-2 border-primary-400 font-semibold'
                : 'hover:bg-white/10 hover:shadow-md'
            }`}
          >
            <PeopleOutlined fontSize="small" className="mr-2" />
            All Users
          </div>
        </Link>
        )}
      </div>
    )}

  </div>
  )}
</nav>
 
          {/* User Info */}
          <div
            className={`p-4 border-t border-white/10 transition-all duration-300 overflow-hidden ${
              isSidebarVisible ? 'opacity-100 max-h-32' : 'opacity-0 max-h-0 p-0'
            }`}
          >
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 flex items-center justify-center text-white shadow-xl flex-shrink-0 ring-2 ring-white/20">
                <PersonIcon />
              </div>
              <div className={`ml-3 transition-all duration-300 ${
                isSidebarVisible
                  ? 'opacity-100 max-w-[200px]'
                  : 'opacity-0 max-w-0 overflow-hidden'
              }`}>
                <p className="text-sm font-semibold text-white whitespace-nowrap">{user?.email?.split('@')[0]}</p>
                <button
                  onClick={handleLogout}
                  className="text-xs font-medium text-white/70 hover:text-white flex items-center transition-colors mt-1 whitespace-nowrap hover:underline"
                >
                  <LogoutIcon className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setSidebarOpen(false)}
        />
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-primary-700 via-primary-800 to-primary-900 shadow-2xl transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <CloseIcon className="h-6 w-6 text-white" />
            </button>
          </div>
 
          <div className="flex-1 h-0 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4 py-5">
              <Logo expanded={true} />
            </div>
 
            <nav className="mt-5 px-2 space-y-2">
              {navItems.filter(item =>item.permissions.some(p => hasPermission(p))).map((item) => (

                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center text-white hover:text-primary-200 ${
                    location.pathname === item.path ? 'font-bold' : ''
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="h-6 w-6 mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
 
          <div className="flex-shrink-0 flex border-t border-primary-500/50 p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-500 flex items-center justify-center text-white shadow-lg">
                <PersonIcon />
              </div>
              <div className="ml-3">
                <p className="text-base font-medium text-white">{user?.email?.split('@')[0]}</p>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-primary-200 hover:text-white flex items-center mt-1"
                >
                  <LogoutIcon className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* Main Content */}
      <div className={`flex flex-col w-0 flex-1 overflow-hidden transition-all duration-300 ${isSidebarVisible ? 'md:ml-64' : 'md:ml-16'}`}>
        {/* Header */}
        <div className="sticky h-[70px] top-0 z-10 bg-gradient-to-r from-primary-700 via-primary-800 to-primary-700 shadow-lg border-b border-primary-600/50 backdrop-blur-sm transition-all duration-300 w-full" style={{ margin: 0, padding: 0 }}>
          {/* Mobile Header */}
          <div className="md:hidden h-full flex items-center justify-center">
            <button
              className="absolute left-4 h-12 w-12 inline-flex items-center justify-center rounded-md text-white hover:text-primary-200 hover:bg-primary-500/30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-300 transition-all duration-200"
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <h1 className="text-base font-semibold text-white font-serif">
              {greeting},<span className="font-bold text-white">{user?.email?.split('@')[0]}</span>
            </h1>
          </div>
 
          {/* Desktop Header */}
       <div
  className="hidden md:flex items-center justify-between px-6 h-full relative transition-all duration-300"
>
  {/* Greeting centered vertically & aligned left */}
  <div className="flex items-center h-full ml-6">
    <h1 className="text-xl font-semibold text-white font-serif">
      {greeting},{" "}
      <span className="font-bold text-white">
        {user?.email?.split("@")[0]}
      </span>
    </h1>
  </div>
 
            <div className="flex items-center space-x-3">
            
              {/* Notification fixed at top right */}
<div className="fixed top-4 right-4 z-50">
  <button className="relative btn-icon">
    <NotificationsIcon className="h-6 w-6 text-white" />
    {notificationCount > 0 && (
      <span
        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500
                   text-xs text-white font-bold flex items-center justify-center
                   animate-pulse-slow"
      >
        {notificationCount}
      </span>
    )}
  </button>
</div>
            </div>
          </div>
        </div>
 
        {/* Page Content */}
        {/* <main className="flex-1 relative overflow-y-auto focus:outline-none animate-fadeIn bg-gradient-to-br from-gray-50 via-white to-gray-50 w-full" style={{ margin: 0, padding: 0 }}> */}
       <main className="flex-1 relative overflow-y-auto focus:outline-none animate-fadeIn bg-[#f4f5f7] w-full" style={{ margin: 0, padding: 0 }}>
  <div className="py-6 px-4 sm:px-6 md:px-8 w-full">
    {children}
  </div>
</main>
      </div>
    </div>
  );
}