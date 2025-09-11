import React, { useState, useEffect, useRef } from 'react';
import { useCamera } from '../contexts/CameraContext';

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
      showWarning("Warning: Multiple faces detected");
    }
    
    // Update previous stats
    setPreviousStats(cameraStats);
  }, [cameraStats, detectionEnabled, previousStats, warningMessage]);

  // Get camera feed URL
  const getCameraUrl = () => {
    return 'http://localhost:8000/camera/camera-integration';
  };

  // Render loading state
  if (isInitializing) {
    return (
      <div className="camera-container bg-black/70 rounded-lg p-4 shadow-md" style={{ width: windowSize.width, height: windowSize.height }}>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 mb-3"></div>
          <span className="text-gray-300">
            {cameraStatus === 'inactive' ? 'Starting camera...' : 'Stopping camera...'}
          </span>
        </div>
      </div>
    );
  }

  // Render error state
  if (cameraStatus === 'error' || cameraError) {
    return (
      <div className="camera-container bg-black/70 rounded-lg p-4 shadow-md flex items-center justify-center" style={{ width: windowSize.width, height: windowSize.height }}>
        <div className="flex flex-col items-center justify-center text-center">
          <WarningIcon className="h-10 w-10 text-red-500 mb-2" />
          <h3 className="text-sm font-medium text-red-200 mb-1">Camera Error</h3>
          <p className="text-sm text-red-300 mb-3">{cameraError || 'Failed to access camera'}</p>
          <button
            onClick={startCamera}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render inactive state
  if (cameraStatus === 'inactive' && !isActive) {
    return (
      <div className="camera-container bg-black/70 rounded-lg p-4 shadow-md flex items-center justify-center" style={{ width: windowSize.width, height: windowSize.height }}>
        <div className="flex flex-col items-center justify-center">
          <VideocamOffIcon className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-300 text-sm text-center mb-3">
            Camera is currently inactive
          </p>
          <button
            onClick={startCamera}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-all"
          >
            <VideocamIcon className="h-4 w-4 mr-1 inline-block" />
            Start Camera
          </button>
        </div>
      </div>
    );
  }

  // Render active camera (or inactive but global camera is active)
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

export default React.memo(CameraProctor);