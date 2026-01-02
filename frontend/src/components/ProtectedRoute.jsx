import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute component — restricts access to authenticated users only.
 * If not authenticated, redirects to /login.
 */
function ProtectedRoute({ children }) {
  const auth = useAuth();
  const location = useLocation();

  // Handle missing context edge case
  if (!auth) {
    console.error("⚠️ ProtectedRoute: useAuth() returned undefined — make sure AuthProvider wraps your App in main.jsx");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const { isAuthenticated, loading } = auth;

  // Show loader while verifying authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  console.log("✅ ProtectedRoute: User is authenticated, granting access to protected route.");
  // Render protected content
  return children;
}

export default ProtectedRoute;