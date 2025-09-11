import { createContext, useContext, useState, useEffect } from 'react';
import interviewService from '../services/interviewService';

// Create the context
const CameraContext = createContext();

/**
 * Custom hook to use the camera context
 * @returns {Object} Camera context values
 */
export const useCamera = () => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
};

/**
 * Camera Provider component
 * Manages global camera state across the application
 */
export const CameraProvider = ({ children }) => {
  // Camera state
  const [isActive, setIsActive] = useState(false);
  const [isDetectionEnabled, setIsDetectionEnabled] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('inactive');
  const [cameraStats, setCameraStats] = useState(null);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Window size for camera (fixed size for consistent UI)
  const windowSize = { width: 210, height: 150 };

  // Start the camera
  const startCamera = async () => {
    if (isActive || isInitializing) return;
    
    try {
      setIsInitializing(true);
      setError(null);
      
      // Start camera with detection setting
      await interviewService.startCamera(windowSize.width, windowSize.height, isDetectionEnabled);
      
      setIsActive(true);
      setCameraStatus('active');
      console.log('Camera started successfully');
    } catch (err) {
      console.error('Error starting camera:', err);
      setError(err.detail || 'Failed to start camera. Please check your camera permissions.');
      setCameraStatus('error');
    } finally {
      setIsInitializing(false);
    }
  };

  // Stop the camera
  const stopCamera = async () => {
    if (!isActive || isInitializing) return;
    
    try {
      setIsInitializing(true);
      
      await interviewService.stopCamera();
      
      setIsActive(false);
      setCameraStatus('inactive');
      console.log('Camera stopped successfully');
    } catch (err) {
      console.error('Error stopping camera:', err);
      // Even if there's an error, mark as inactive
      setIsActive(false);
      setCameraStatus('inactive');
    } finally {
      setIsInitializing(false);
    }
  };

  // Toggle detection
  const toggleDetection = async (enabled) => {
    if (!isActive) return;
    
    try {
      await interviewService.toggleDetection(enabled);
      setIsDetectionEnabled(enabled);
      console.log(`Detection ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Error toggling detection:', err);
    }
  };

  // Fetch camera status periodically
  useEffect(() => {
    let statusInterval = null;
    
    if (isActive) {
      // Initial fetch
      fetchCameraStatus();
      
      // Set up interval for periodic updates
      statusInterval = setInterval(fetchCameraStatus, 5000);
    }
    
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [isActive]);

  // Fetch camera status
  const fetchCameraStatus = async () => {
    if (!isActive) return;
    
    try {
      const response = await interviewService.getCameraStatus();
      
      // Only update statistics if they've changed
      if (JSON.stringify(response.statistics) !== JSON.stringify(cameraStats)) {
        setCameraStats(response.statistics);
      }
      
      // Only update detection status if it doesn't match
      if (response.detection_enabled !== isDetectionEnabled) {
        setIsDetectionEnabled(response.detection_enabled);
      }
      
      // Only update active status if it doesn't match
      if ((response.active && cameraStatus !== 'active') ||
          (!response.active && cameraStatus === 'active')) {
        setCameraStatus(response.active ? 'active' : 'inactive');
        if (!response.active) setIsActive(false);
      }
    } catch (err) {
      console.error('Error fetching camera status:', err);
    }
  };

  // Context value
  const value = {
    isActive,
    isDetectionEnabled,
    cameraStatus,
    cameraStats,
    error,
    isInitializing,
    windowSize,
    startCamera,
    stopCamera,
    toggleDetection,
    setCameraStatus
  };

  return (
    <CameraContext.Provider value={value}>
      {children}
    </CameraContext.Provider>
  );
};