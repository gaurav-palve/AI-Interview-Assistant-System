import { useState, useEffect, useRef } from 'react';
import interviewService from '../services/interviewService';

// Material UI Icons
import {
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

/**
 * CameraProctor component
 * Displays a camera feed for proctoring during interviews
 */
function CameraProctor({ active = false, onStatusChange }) {
  const [cameraStatus, setCameraStatus] = useState('inactive');
  const [cameraStats, setCameraStats] = useState(null);
  const [previousStats, setPreviousStats] = useState(null);
  const [error, setError] = useState(null);
  const [warningMessage, setWarningMessage] = useState(null);
  
  // Fixed camera size of approximately 3cm by 2cm (converted to pixels)
  // Assuming 96 DPI, 3cm ≈ 113px, 2cm ≈ 75px
  const [windowSize] = useState({ width: 210, height: 150 });
  const cameraRef = useRef(null);
  const statusInterval = useRef(null);
  const warningTimeoutRef = useRef(null);

  // Helper function to show warning messages
  const showWarning = (message) => {
    setWarningMessage(message);
    
    // Clear any existing timeout
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    // Set a timeout to clear the warning after 3 seconds
    warningTimeoutRef.current = setTimeout(() => {
      setWarningMessage(null);
    }, 3000);
  };

  // Start or stop camera based on active prop
  useEffect(() => {
    if (active && cameraStatus === 'inactive') {
      startCamera();
    } else if (!active && cameraStatus === 'active') {
      stopCamera();
    }

    // Cleanup on unmount
    return () => {
      if (statusInterval.current) {
        clearInterval(statusInterval.current);
      }
      if (cameraStatus === 'active') {
        stopCamera();
      }
    };
  }, [active, cameraStatus]);

  // Start polling for camera status when active
  useEffect(() => {
    if (cameraStatus === 'active') {
      // Poll camera status every 5 seconds
      statusInterval.current = setInterval(fetchCameraStatus, 5000);
    } else {
      if (statusInterval.current) {
        clearInterval(statusInterval.current);
      }
    }

    return () => {
      if (statusInterval.current) {
        clearInterval(statusInterval.current);
      }
    };
  }, [cameraStatus]);
  
  // No auto-refresh to ensure constant streaming

  /**
   * Start the camera
   */
  const startCamera = async () => {
    try {
      setCameraStatus('starting');
      setError(null);
      
      // Start camera with calculated window size
      await interviewService.startCamera(windowSize.width, windowSize.height);
      
      setCameraStatus('active');
      if (onStatusChange) onStatusChange('active');
      
      // Start polling for camera status
      fetchCameraStatus();
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Failed to start camera. Please check your camera permissions.');
      setCameraStatus('error');
      if (onStatusChange) onStatusChange('error');
    }
  };

  /**
   * Stop the camera
   */
  const stopCamera = async () => {
    try {
      setCameraStatus('stopping');
      
      await interviewService.stopCamera();
      
      setCameraStatus('inactive');
      if (onStatusChange) onStatusChange('inactive');
    } catch (err) {
      console.error('Error stopping camera:', err);
      // Even if there's an error, mark as inactive
      setCameraStatus('inactive');
      if (onStatusChange) onStatusChange('inactive');
    }
  };

  /**
   * Fetch camera status and statistics
   */
  const fetchCameraStatus = async () => {
    try {
      const response = await interviewService.getCameraStatus();
      setCameraStats(response.statistics);
      
      // Update status if it doesn't match
      if (response.active && cameraStatus !== 'active') {
        setCameraStatus('active');
        if (onStatusChange) onStatusChange('active');
      } else if (!response.active && cameraStatus === 'active') {
        setCameraStatus('inactive');
        if (onStatusChange) onStatusChange('inactive');
      }
      
      // Check for warning conditions
      if (response.statistics) {
        // Store previous stats for comparison
        const prevStats = previousStats || {
          looking_away_detections: 0,
          hand_on_face_detections: 0,
          phone_detections: 0,
          face_missing_detections: 0
        };
        
        // Looking away detection (exactly on multiples of 5)
        const lookingAwayCount = response.statistics.looking_away_detections;
        if (lookingAwayCount % 5 === 0 &&
            lookingAwayCount > 0 &&
            lookingAwayCount !== prevStats.looking_away_detections &&
            !warningMessage) {
          showWarning("Warning: You appear to be looking away from the screen");
        }
        
        // Hand on face detection (exactly on multiples of 5)
        const handOnFaceCount = response.statistics.hand_on_face_detections;
        if (handOnFaceCount % 5 === 0 &&
            handOnFaceCount > 0 &&
            handOnFaceCount !== prevStats.hand_on_face_detections &&
            !warningMessage) {
          showWarning("Warning: Hand on face detected");
        }
        
        // Mobile phone detection (every count)
        const phoneCount = response.statistics.phone_detections;
        const prevPhoneCount = prevStats.phone_detections;
        if (phoneCount > prevPhoneCount && !warningMessage) {
          showWarning("Warning: Mobile phone detected");
        }
        
        // Multiple faces detection (every count)
        const faceCount = response.statistics.face_missing_detections;
        const prevFaceCount = prevStats.face_missing_detections;
        if (faceCount > prevFaceCount && !warningMessage) {
          showWarning("Warning: Face not visible or multiple faces detected");
        }
        
        // Update previous stats
        setPreviousStats(response.statistics);
      }
    } catch (err) {
      console.error('Error fetching camera status:', err);
    }
  };

  /**
   * Get camera feed URL
   */
  const getCameraUrl = () => {
    // Use a direct URL to the camera feed
    return 'http://localhost:8000/camera/camera-integration';
  };

  // Render loading state
  if (cameraStatus === 'starting' || cameraStatus === 'stopping') {
    return (
      <div className="camera-container bg-gray-100 dark:bg-gray-800 rounded-lg p-2 shadow-md" style={{ width: windowSize.width, height: windowSize.height }}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-300">
            {cameraStatus === 'starting' ? 'Starting camera...' : 'Stopping camera...'}
          </span>
        </div>
      </div>
    );
  }

  // Render error state
  if (cameraStatus === 'error') {
    return (
      <div className="camera-container bg-red-50 dark:bg-red-900/30 rounded-lg p-3 shadow-md" style={{ width: windowSize.width }}>
        <div className="flex items-start">
          <WarningIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Camera Error</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error || 'Failed to access camera'}</p>
            <button
              onClick={startCamera}
              className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs font-medium rounded-md hover:bg-red-200 dark:hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render inactive state
  if (cameraStatus === 'inactive') {
    return (
      <div className="camera-container bg-gray-100 dark:bg-gray-800 rounded-lg p-4 shadow-md" style={{ width: windowSize.width }}>
        <div className="flex flex-col items-center justify-center">
          <VideocamOffIcon className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
            Camera is currently inactive
          </p>
          {!active && (
            <button
              onClick={startCamera}
              className="mt-3 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
            >
              <VideocamIcon className="h-4 w-4 mr-1 inline-block" />
              Start Camera
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render active camera
  return (
    <div className="camera-container relative">
      <div className="camera-frame rounded-lg overflow-hidden shadow-md" style={{ width: windowSize.width, height: windowSize.height }}>
        {/* Use iframe for smoother streaming without blinking */}
        <iframe
          ref={cameraRef}
          src={getCameraUrl()}
          title="Camera Feed"
          className="w-full h-full border-0"
          style={{
            backgroundColor: '#000',
            objectFit: 'cover',
            overflow: 'hidden'
          }}
          frameBorder="0"
          scrolling="no"
          allowFullScreen
        ></iframe>
      </div>
      
      {/* Camera status indicator */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
      </div>
      
      {/* Warning message display */}
      {warningMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium">
            {warningMessage}
          </div>
        </div>
      )}
    </div>
  );
}

export default CameraProctor;