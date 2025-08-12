import { Link } from 'react-router-dom';

// Material UI Icons
import {
  Home as HomeIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

/**
 * NotFound page component
 * Displayed when a route is not found
 */
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <ErrorIcon className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            404 - Page Not Found
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <HomeIcon className="-ml-1 mr-2 h-5 w-5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;