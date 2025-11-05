import React, { useState, useEffect, useRef } from 'react';
import { useCamera } from '../contexts/CameraContext';

// Material UI Icons
import {
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  FiberManualRecord as RecordIcon,
  PersonOff as PersonOffIcon,
  PhoneAndroid as PhoneIcon,
  PeopleAlt as PeopleIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

/**
 * CameraProctor component
 * Displays a camera feed for proctoring during interviews
 * @param {boolean} detectionEnabled - Whether cheating detection is enabled
 */
function CameraProctor({ detectionEnabled = false }) {
  // Use the global camera context
  const {
    isActive,
    cameraStatus,
    setCameraStatus,
    startCamera,
    stopCamera,
    toggleDetection,
    error: cameraError,
    windowSize,
    isInitializing,
    cameraStats,
    isDetectionEnabled
  } = useCamera();

  const [warningMessage, setWarningMessage] = useState(null);
  const [previousStats, setPreviousStats] = useState(null);
  const cameraRef = useRef(null);
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

  // Toggle detection based on prop, but only when it actually changes
  useEffect(() => {
    if (isActive && detectionEnabled !== isDetectionEnabled) {
      toggleDetection(detectionEnabled);
    }
  }, [detectionEnabled, isActive, toggleDetection, isDetectionEnabled]);

  // Process camera stats for warnings
  useEffect(() => {
    if (!cameraStats || !detectionEnabled) return;
    
    // Store previous stats for comparison
    const prevStats = previousStats || {
      looking_away_detections: 0,
      phone_detections: 0,
      face_missing_detections: 0
    };
    
    // Looking away detection - Show warning every 5 detections
    const lookingAwayCount = cameraStats.looking_away_detections;
    if (lookingAwayCount > 0 &&
        lookingAwayCount % 5 === 0 &&  // Show warning every 5 detections
        lookingAwayCount !== prevStats.looking_away_detections &&
        !warningMessage) {
      showWarning("Warning: You appear to be looking away from the screen");
    }
    
    // Mobile phone detection - Show warning immediately for each detection
    const phoneCount = cameraStats.phone_detections;
    const prevPhoneCount = prevStats.phone_detections;
    if (phoneCount > 0 &&
        phoneCount !== prevPhoneCount &&
        !warningMessage) {
      showWarning("Warning: Mobile phone detected");
    }
    
    // No face detection - Show warning immediately
    const faceCount = cameraStats.face_missing_detections;
    const prevFaceCount = prevStats.face_missing_detections;
    if (faceCount > 0 &&
        faceCount !== prevFaceCount &&
        !warningMessage) {
      showWarning("Warning: Face not visible");
    }
    
    // Multiple faces detection - Show warning immediately
    // Note: This assumes the backend is sending this data in the stats
    const multipleFacesCount = cameraStats.multiple_faces_detections || 0;
    const prevMultipleFacesCount = (prevStats.multiple_faces_detections || 0);
    if (multipleFacesCount > 0 &&
        multipleFacesCount !== prevMultipleFacesCount &&
        !warningMessage) {
      showWarning("Warning: Multiple faces detected in camera view");
    }
    
    // Update previous stats
    setPreviousStats(cameraStats);
  }, [cameraStats, detectionEnabled, previousStats, warningMessage]);

  // Get camera feed URL
  const getCameraUrl = () => {
    return 'http://localhost:8000/api/camera/camera-integration';
  };

  // Render loading state
  if (isInitializing) {
    return (
      <div className="camera-wrapper">
        <div 
          className="camera-container relative bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-700 animate-pulse"
          style={{ width: windowSize.width, height: windowSize.height }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="bg-gray-800/80 rounded-2xl p-8 backdrop-blur-md">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600"></div>
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-500 absolute top-0 left-0"></div>
                </div>
                <div className="text-center">
                  <p className="text-white font-medium text-sm">
                    {cameraStatus === 'inactive' ? 'Initializing Camera' : 'Shutting Down Camera'}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">Please wait...</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative corner elements */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary-500/50"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary-500/50"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary-500/50"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary-500/50"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (cameraStatus === 'error' || cameraError) {
    return (
      <div className="camera-wrapper">
        <div 
          className="camera-container relative bg-gradient-to-br from-red-950/30 to-black rounded-2xl shadow-2xl overflow-hidden border-2 border-red-900/50"
          style={{ width: windowSize.width, height: windowSize.height }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-red-950/80 rounded-2xl p-8 backdrop-blur-md border border-red-800/50 max-w-sm animate-slideInUp">
              <div className="flex flex-col items-center text-center space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-red-100 mb-2">Camera Access Error</h3>
                  <p className="text-sm text-red-200/80 mb-1">
                    {cameraError || 'Unable to access your camera'}
                  </p>
                  <p className="text-xs text-red-300/60 mt-2">
                    Please ensure camera permissions are granted and no other application is using the camera.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={startCamera}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-all duration-300"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Error decoration */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
        </div>
      </div>
    );
  }

  // Render inactive state
  if (cameraStatus === 'inactive' && !isActive) {
    return (
      <div className="camera-wrapper">
        <div 
          className="camera-container relative bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-700"
          style={{ width: windowSize.width, height: windowSize.height }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-gray-800/80 rounded-2xl p-8 backdrop-blur-md border border-gray-700/50 animate-slideInUp">
              <div className="flex flex-col items-center space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">Camera Inactive</h3>
                  <p className="text-sm text-gray-400 mb-1">
                    Your camera is currently turned off
                  </p>
                  <p className="text-xs text-gray-500">
                    Click below to activate camera feed
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Activate Camera
                </button>
              </div>
            </div>
          </div>
          
          {/* Decorative grid pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full" style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(255,255,255,0.05) 35px, rgba(255,255,255,0.05) 70px),
                               repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(255,255,255,0.05) 35px, rgba(255,255,255,0.05) 70px)`
            }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Render active camera (or inactive but global camera is active)
  return (
    <div className="camera-wrapper">
      <div 
        className="camera-container relative bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-700 group"
        style={{ width: windowSize.width, height: windowSize.height }}
      >
        {/* Main camera frame with enhanced styling */}
        <div className="camera-frame relative w-full h-full rounded-xl overflow-hidden">
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
          
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
        </div>
        
        
        {/* Warning overlay with improved styling */}
        {warningMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-gradient-to-r from-red-900 to-red-800 text-white px-6 py-4 rounded-xl shadow-2xl border border-red-700 animate-slideInUp max-w-md">
              <div className="text-center">
                <p className="text-sm font-semibold">Proctoring Alert</p>
                <p className="text-xs text-red-100 mt-1">{warningMessage}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(CameraProctor);
