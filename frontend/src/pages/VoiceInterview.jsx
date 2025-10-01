import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import voiceInterviewService from '../services/voiceInterviewService';
import interviewService from '../services/interviewService';
import { useCamera } from '../contexts/CameraContext';

import VoiceInterviewControls from '../components/VoiceInterview/VoiceInterviewControls';
import AudioRecorder from '../components/VoiceInterview/AudioRecorder';
import TranscriptDisplay from '../components/VoiceInterview/TranscriptDisplay';
import VoiceInterviewResults from '../components/VoiceInterview/VoiceInterviewResults';
import CameraProctor from '../components/CameraProctor';

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
  const { toggleDetection, isActive } = useCamera();
  const [aiThinking, setAiThinking] = useState(false);
  const [interviewProgress, setInterviewProgress] = useState(0);

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
  
  // Enable detection for voice interview
  toggleDetection(true);
  
  // Cleanup on unmount
  return () => {
    // Detection will be managed by the context
  };
}, [interviewId, toggleDetection, loadInterview, interview]);

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
      // Disable detection when interview is completed
      toggleDetection(false);
      // Camera will be managed by the context
    }

  } catch (err) {
    setError(err.message || 'Failed to stop voice interview');
    console.error('Error stopping interview:', err);
  } finally {
    setIsProcessing(false);
  }
}, [voiceSession, durationTracker, toggleDetection]);

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
      {isActive && (
        <div className="absolute top-4 right-4 z-50" style={{ width: '180px', height: '135px' }}>
          <div className="bg-black/70 rounded-lg overflow-hidden shadow-xl w-full h-full">
            <CameraProctor
              detectionEnabled={true} // Enable detection during voice interview
            />
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
              <button className="group flex items-center text-white/70 hover:text-white transition-all duration-300 hover:scale-105">
                <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="font-medium">Back</span>
              </button>
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

        {/* Preparation Instructions */}
        {status === 'pending' && (
          <div className={`mt-12 bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 ${fadeInUp}`}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Prepare for Your Voice Interview
              </h3>
              <p className="text-white/60">Follow these steps to ensure the best interview experience</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <h4 className="font-semibold text-blue-400 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                      <Mic className="w-4 h-4 text-blue-400" />
                    </div>
                    Audio Setup
                  </h4>
                  <div className="space-y-3">
                    {[
                      'Test your microphone before starting',
                      'Use headphones to prevent echo',
                      'Speak clearly at a moderate pace',
                      'Position microphone 6-12 inches away'
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 group">
                        <div className="w-2 h-2 bg-green-400 rounded-full group-hover:scale-125 transition-transform duration-200"></div>
                        <span className="text-white/80 text-sm group-hover:text-white transition-colors duration-200">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <h4 className="font-semibold text-purple-400 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                      <Wifi className="w-4 h-4 text-purple-400" />
                    </div>
                    Environment
                  </h4>
                  <div className="space-y-3">
                    {[
                      'Find a quiet space with minimal noise',
                      'Ensure stable internet connection',
                      'Close unnecessary applications',
                      'Have good lighting for video calls'
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 group">
                        <div className="w-2 h-2 bg-green-400 rounded-full group-hover:scale-125 transition-transform duration-200"></div>
                        <span className="text-white/80 text-sm group-hover:text-white transition-colors duration-200">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <h4 className="font-semibold text-pink-400 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center mr-3">
                      <Brain className="w-4 h-4 text-pink-400" />
                    </div>
                    Interview Tips
                  </h4>
                  <div className="space-y-3">
                    {[
                      'Take your time to think before answering',
                      'Be specific with examples and details',
                      'Ask for clarification if needed',
                      'Stay calm and speak naturally'
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 group">
                        <div className="w-2 h-2 bg-green-400 rounded-full group-hover:scale-125 transition-transform duration-200"></div>
                        <span className="text-white/80 text-sm group-hover:text-white transition-colors duration-200">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl p-6 border border-cyan-500/30">
                  <h4 className="font-semibold text-cyan-400 mb-3 flex items-center">
                    <Heart className="w-5 h-5 mr-2" />
                    You've Got This!
                  </h4>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Remember, this is a conversation, not an interrogation. The AI interviewer is here to understand your skills and experience. Be yourself and showcase what makes you unique!
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Requirements */}
            <div className="mt-8 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl p-6 border border-indigo-500/20">
              <h4 className="font-semibold text-indigo-400 mb-4 text-center">Technical Requirements</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto">
                    <Mic className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-sm text-white/80">Microphone Access</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto">
                    <Wifi className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-sm text-white/80">Stable Internet</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto">
                    <Volume2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <p className="text-sm text-white/80">Audio Output</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6 text-pink-400" />
                  </div>
                  <p className="text-sm text-white/80">30-45 Minutes</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>


    </div>
  );
};

export default React.memo(VoiceInterview);
