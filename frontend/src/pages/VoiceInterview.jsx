import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import voiceInterviewService from '../services/voiceInterviewService';
import interviewService from '../services/interviewService';

import VoiceInterviewControls from '../components/VoiceInterview/VoiceInterviewControls';
// import AudioRecorder from '../components/VoiceInterview/AudioRecorder';
import TranscriptDisplay from '../components/VoiceInterview/TranscriptDisplay';
import VoiceInterviewResults from '../components/VoiceInterview/VoiceInterviewResults';
import CameraProctorNew from '../components/CameraProctorNew';

import { ArrowLeft, AlertCircle, Loader2, Mic, Download, Clock, CheckCircle, Volume2, Wifi, WifiOff, MessageSquare, Zap, Brain, Heart, Camera } from 'lucide-react';

// Constants
const WS_RECONNECT_DELAY = 3000;
const WS_MAX_RECONNECT_ATTEMPTS = 5;
const DURATION_UPDATE_INTERVAL = 1000;

// Animation variants - using Tailwind classes
const fadeInUp = "animate-in fade-in-0 slide-in-from-bottom-4 duration-600";
const pulseGlow = "animate-pulse";

// Custom hook for WebSocket management
const useWebSocket = (url, onMessage, enabled = true) => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!url || !enabled) return;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        setSocket(null);

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < WS_MAX_RECONNECT_ATTEMPTS && enabled) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current}/${WS_MAX_RECONNECT_ATTEMPTS})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, WS_RECONNECT_DELAY);
        }
      };

      setSocket(ws);
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setConnectionStatus('error');
    }
  }, [url, enabled, onMessage]);

  useEffect(() => {
    if (enabled && url) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [connect, enabled, url]);

  return { socket, connectionStatus };
};

// Custom hook for duration tracking
const useDurationTracker = (isActive) => {
  const [duration, setDuration] = useState(0);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setDuration(elapsed);
    }, DURATION_UPDATE_INTERVAL);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setDuration(0);
    startTimeRef.current = null;
  }, [stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { duration, start, stop, reset };
};

const VoiceInterview = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // State management
  const [interview, setInterview] = useState(null);
  const [voiceSession, setVoiceSession] = useState(null);
  const [status, setStatus] = useState('pending');
  const [transcript, setTranscript] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candidateId, setCandidateId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('excellent');
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [fallbackReason, setFallbackReason] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [interviewProgress, setInterviewProgress] = useState(0);
  const [cameraReady, setCameraReady] = useState(true);

  // Handle cheating detection and show toast
  const handleCheatingDetected = useCallback((type, message) => {
    const cheatingTypeMap = {
      'FACE_MISSING': { title: 'Warning: Face Not Visible', colorScheme: 'orange' },
      'MULTIPLE_FACES': { title: 'Warning: Multiple Faces Detected', colorScheme: 'red' },
      'LOOK_AWAY': { title: 'Warning: Looking Away', colorScheme: 'orange' },
      'PHONE_DETECTED': { title: 'Warning: Phone Detected', colorScheme: 'red' },
      'TAB_SWITCH': { title: 'Warning: Tab Switched', colorScheme: 'red' },
      'WINDOW_BLUR': { title: 'Warning: Window Lost Focus', colorScheme: 'red' }
    };

    const config = cheatingTypeMap[type] || { title: 'Warning Detected', colorScheme: 'orange' };

    toast({
      title: config.title,
      description: message,
      status: type === 'PHONE_DETECTED' || type === 'MULTIPLE_FACES' || type === 'TAB_SWITCH' || type === 'WINDOW_BLUR' ? 'error' : 'warning',
      duration: 4000,
      isClosable: true,
      position: 'top-right',
      variant: 'solid'
    });

    console.warn(`Cheating detected: ${type}`, message);
  }, [toast]);

  // Custom hooks
  const durationTracker = useDurationTracker(status === 'active');

  // WebSocket management
  const wsUrl = useMemo(() => {
    if (!voiceSession?.websocket_url) return null;

    const url = voiceSession.websocket_url;
    if (url.startsWith('/')) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.hostname}:8000${url}`;
    }
    return url;
  }, [voiceSession]);

  const handleWebSocketMessage = useCallback((data) => {
    console.log("WebSocket message received:", data);

    switch (data.type) {
      case 'connection_status':
        if (data.status === 'fallback_mode') {
          console.log("Switching to fallback mode:", data.fallback_reason);
          setIsFallbackMode(true);
          setFallbackReason(data.fallback_reason || 'Voice service unavailable');
        }
        break;

      case 'transcript_update':
        setTranscript(prev => {
          // Avoid duplicate entries
          const newText = data.text.trim();
          if (newText && !prev.endsWith(newText)) {
            return prev + (prev ? '\n\n' : '') + (data.role === 'agent' ? 'AI: ' : 'You: ') + newText;
          }
          return prev;
        });
        break;

      case 'connection_quality':
        setConnectionQuality(data.quality);
        break;

      case 'interview_complete':
        handleInterviewComplete();
        break;

      case 'agent_typing':
        setAiThinking(data.typing);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, []);

  const { socket: websocket, connectionStatus: wsConnectionStatus } = useWebSocket(
    wsUrl,
    handleWebSocketMessage,
    status === 'active'
  );
// Define loadInterview BEFORE the useEffect that uses it
const loadInterview = useCallback(async () => {
  if (interview) return; // Skip if we already have interview data
  
  try {
    setLoading(true);
    setError(null);

    // Get interview data
    const interviewData = await interviewService.getCandidateInterview(interviewId);

    if (!interviewData) {
      throw new Error('Interview not found');
    }

    setInterview(interviewData);

    // Generate candidate ID
    const tempCandidateId = `candidate-${interviewData.candidate_email || Date.now()}`;
    setCandidateId(tempCandidateId);


  } catch (err) {
    setError(err.message || 'Failed to load interview data');
    console.error('Error loading interview:', err);
  } finally {
    setLoading(false);
  }
}, [interview, interviewId]);

// Load interview data on mount and enable detection
useEffect(() => {
  // Only load interview data if we don't have it
  if (!interview) {
    loadInterview();
  }
  
  // Auto-start camera on component mount
  setCameraReady(true);
  
  // Cleanup on unmount
  return () => {
    // Camera will be managed by the component
  };
}, [interviewId, loadInterview, interview]);

const startInterview = useCallback(async () => {
  try {
    setError(null);
    setIsProcessing(true);

    const response = await voiceInterviewService.startVoiceInterview(
      interviewId,
      candidateId
    );

    if (!response) {
      throw new Error('Failed to start interview session');
    }

    setVoiceSession(response);
    setStatus('active');
    durationTracker.start();
    
    // Detection is already enabled

  } catch (err) {
    setError(err.message || 'Failed to start voice interview');
    console.error('Error starting interview:', err);
  } finally {
    setIsProcessing(false);
  }
}, [interviewId, candidateId, durationTracker]);
const stopInterview = useCallback(async () => {
  try {
    setIsProcessing(true);
    durationTracker.stop();

    if (voiceSession) {
      const completedSession = await voiceInterviewService.completeVoiceInterview(
        voiceSession.session_id,
        durationTracker.duration
      );

      setVoiceSession(completedSession);
      setStatus('completed');
      setResults(completedSession);
      // Interview completed
    }

  } catch (err) {
    setError(err.message || 'Failed to stop voice interview');
    console.error('Error stopping interview:', err);
  } finally {
    setIsProcessing(false);
  }
}, [voiceSession, durationTracker]);

  const handleInterviewComplete = useCallback(() => {
    stopInterview();
  }, [stopInterview]);

  const handleRecordingComplete = useCallback((audioBlob) => {
    console.log('Recording completed:', audioBlob);
    // Send audio to backend if needed
    if (websocket && websocket.readyState === WebSocket.OPEN && !isFallbackMode) {
      // Convert blob to base64 or send via API
    }
  }, [websocket, isFallbackMode]);

  const handleAudioLevelChange = useCallback((level) => {
    setAudioLevel(level);
  }, []);

  const handleRecordingStateChange = useCallback((isRecordingState) => {
    setIsRecording(isRecordingState);
  }, []);

  const sendTextMessage = useCallback(() => {
    if (websocket && websocket.readyState === WebSocket.OPEN && userMessage.trim()) {
      const message = {
        type: 'text',
        message: userMessage.trim()
      };
      websocket.send(JSON.stringify(message));
      setUserMessage('');
    }
  }, [websocket, userMessage]);

  const downloadTranscript = useCallback(() => {
    if (!transcript) {
      setError('No transcript available to download');
      return;
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `interview-transcript-${interviewId}-${timestamp}.txt`;

      const content = `Interview Transcript
==================
Interview ID: ${interviewId}
Date: ${new Date().toLocaleString()}
Duration: ${Math.floor(durationTracker.duration / 60)}:${(durationTracker.duration % 60).toString().padStart(2, '0')}
==================

${transcript}`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download transcript');
      console.error('Download error:', err);
    }
  }, [transcript, interviewId, durationTracker.duration]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="text-center relative z-10">
          <Loader2 className="animate-spin h-12 w-12 text-purple-400 mx-auto mb-4" />
          <p className="text-white/60">Loading interview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h2 className="text-lg font-semibold text-red-200 mb-2">Error</h2>
              <p className="text-red-100">{error}</p>
              <button
                onClick={() => navigate(-1)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Camera element - small version in corner */}
      {cameraReady && (
        <div className="absolute top-4 right-4 z-50" style={{ width: '180px', height: '135px' }}>
          <div className="bg-black/70 rounded-lg overflow-hidden shadow-xl w-full h-full">
            <CameraProctorNew autoStart={true} sessionId={interviewId} hideControls={true} onCheatingDetected={handleCheatingDetected} />
          </div>
        </div>
      )}
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-pink-500/5 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      {/* Glassmorphism Header */}
      <header className="relative z-10 backdrop-blur-xl bg-white/10 border-b border-white/20 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* <button className="group flex items-center text-white/70 hover:text-white transition-all duration-300 hover:scale-105">
                <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="font-medium">Back</span>
              </button> */}
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Voice Interview
                </h1>
                {interview && (
                  <p className="text-white/60 mt-1">{interview.title}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Connection Status */}
              {status === 'active' && (
                <div className="flex items-center space-x-3 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                  <div className="relative">
                    <Wifi className="w-5 h-5 text-green-400" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                  </div>
                  <span className="text-sm font-medium">Connected</span>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center space-x-3 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                {status === 'active' && <Mic className="w-4 h-4 text-red-400 animate-pulse" />}
                {status === 'completed' && <CheckCircle className="w-4 h-4 text-green-400" />}
                <span className="text-sm font-medium capitalize">{status}</span>
              </div>

              {/* Duration */}
              {(status === 'active' || status === 'completed') && (
                <div className="flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="font-mono text-sm">
                    {Math.floor(durationTracker.duration / 60).toString().padStart(2, '0')}:
                    {(durationTracker.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {status === 'active' && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-white/60 mb-2">
                <span>Interview Progress</span>
                <span>{Math.round(interviewProgress)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${interviewProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Error Alert */}
      {error && interview && (
        <div className="relative z-10 max-w-7xl mx-auto px-6 mt-6">
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-red-200">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 hover:scale-110 transition-all duration-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {status === 'completed' && results ? (
          // Results View
          <div className={`space-y-8 ${fadeInUp}`}>
            <VoiceInterviewResults
              results={results}
              onDownloadTranscript={downloadTranscript}
              interviewId={interviewId}
            />
          </div>
        ) : (
          // Interview Interface
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 h-[calc(100vh-200px)]">
            {/* Left Column - Controls */}
            <div className="xl:col-span-2 space-y-6">
              <VoiceInterviewControls
                status={status}
                onStart={startInterview}
                onStop={stopInterview}
                duration={durationTracker.duration}
                connectionQuality={connectionQuality}
                audioLevel={audioLevel}
                isRecording={isRecording}
                isFallbackMode={isFallbackMode}
                fallbackReason={fallbackReason}
              />

              {/* Fallback Mode */}
              {isFallbackMode && status === 'active' && (
                <div className={`bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30 ${fadeInUp}`}>
                  <div className="flex items-center text-yellow-400 mb-4">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <h3 className="font-semibold">Text Mode Active</h3>
                  </div>
                  <p className="text-white/60 text-sm mb-4">Voice service temporarily unavailable. Continue with text input:</p>

                  <div className="space-y-4">
                    <textarea
                      className="w-full p-4 bg-black/20 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/40 backdrop-blur-sm resize-none"
                      placeholder="Type your response here..."
                      rows={4}
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                    />
                    <button
                      onClick={sendTextMessage}
                      disabled={!userMessage.trim()}
                      className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send Response
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Transcript */}
            <div className="xl:col-span-3">
              <TranscriptDisplay
                transcript={transcript}
                isLive={status === 'active'}
                aiThinking={aiThinking}
                connectionQuality={connectionQuality}
                className="h-full"
              />
            </div>
          </div>
        )}

      
      
      </main>


    </div>
  );
};

export default React.memo(VoiceInterview);
