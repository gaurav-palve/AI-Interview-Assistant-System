import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { Conversation } from '@elevenlabs/client';
import voiceInterviewService from '../services/voiceInterviewService';
import interviewService from '../services/interviewService';
 
import VoiceInterviewControls from '../components/VoiceInterview/VoiceInterviewControls';
import TranscriptDisplay from '../components/VoiceInterview/TranscriptDisplay';
import VoiceInterviewResults from '../components/VoiceInterview/VoiceInterviewResults';
import CameraProctorNew from '../components/CameraProctorNew';
 
import { ArrowLeft, AlertCircle, Loader2, Mic, Download, Clock, CheckCircle, Volume2, Wifi, WifiOff, MessageSquare, Zap, Brain, Heart, Camera } from 'lucide-react';
 
// Constants
const DURATION_UPDATE_INTERVAL = 1000;
 
// Animation variants
const fadeInUp = "animate-in fade-in-0 slide-in-from-bottom-4 duration-600";
 
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
 
  // Refs for ElevenLabs conversation
  const conversationRef = useRef(null);
  const transcriptDataRef = useRef([]); // Collects {role, text} for backend
 
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
 
  // Define loadInterview BEFORE the useEffect that uses it
  const loadInterview = useCallback(async () => {
    if (interview) return;
 
    try {
      setLoading(true);
      setError(null);
 
      const interviewData = await interviewService.getCandidateInterview(interviewId);
 
      if (!interviewData) {
        throw new Error('Interview not found');
      }
 
      setInterview(interviewData);
 
      const tempCandidateId = `candidate-${interviewData.candidate_email || Date.now()}`;
      setCandidateId(tempCandidateId);
 
    } catch (err) {
      setError(err.message || 'Failed to load interview data');
      console.error('Error loading interview:', err);
    } finally {
      setLoading(false);
    }
  }, [interview, interviewId]);
 
  // Load interview data on mount
  useEffect(() => {
    if (!interview) {
      loadInterview();
    }
    setCameraReady(true);
 
    return () => {
      // Cleanup: end conversation if still active
      if (conversationRef.current) {
        try {
          conversationRef.current.endSession();
        } catch (e) {
          console.error('Error ending conversation on unmount:', e);
        }
      }
    };
  }, [interviewId, loadInterview, interview]);
 
  /**
   * Start the voice interview using client-side WebRTC.
   * 1. Fetch signed URL from backend
   * 2. Start ElevenLabs conversation in the browser
   */
  const startInterview = useCallback(async () => {
    try {
      setError(null);
      setIsProcessing(true);
 
      // Step 1: Get signed URL + create session in backend
      const response = await voiceInterviewService.getSignedUrl(
        interviewId,
        candidateId
      );
 
      if (!response || !response.signed_url) {
        throw new Error('Failed to get signed URL for voice interview');
      }
 
      setVoiceSession(response);
 
      // Step 2: Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
 
      // Step 3: Start ElevenLabs conversation client-side via WebRTC
      const conversation = await Conversation.startSession({
        signedUrl: response.signed_url,
        onConnect: () => {
          console.log('ElevenLabs WebRTC connected');
          setIsRecording(true);
          setConnectionQuality('excellent');
        },
        onDisconnect: () => {
          console.log('ElevenLabs WebRTC disconnected');
          setIsRecording(false);
        },
        onMessage: (message) => {
          console.log('ElevenLabs message:', message);
 
          // Handle transcript messages from the SDK
          if (message.source === 'ai') {
            const text = message.message;
            if (text) {
              transcriptDataRef.current.push({ role: 'agent', text });
              setTranscript(prev =>
                prev + (prev ? '\n\n' : '') + 'AI: ' + text
              );
              setAiThinking(false);
            }
          }
        },
        onError: (error) => {
          console.error('ElevenLabs error:', error);
          setError('Voice connection error. Please try again.');
        },
        onStatusChange: (statusInfo) => {
          console.log('ElevenLabs status:', statusInfo);
          if (statusInfo.status === 'listening') {
            setAiThinking(false);
          } else if (statusInfo.status === 'processing') {
            setAiThinking(true);
          }
        },
        onModeChange: (modeInfo) => {
          console.log('ElevenLabs mode change:', modeInfo);
          if (modeInfo.mode === 'listening') {
            setAiThinking(false);
          } else if (modeInfo.mode === 'speaking') {
            setAiThinking(false);
          }
        },
      });
 
      conversationRef.current = conversation;
      setStatus('active');
      durationTracker.start();
 
      // Set up user transcript collection
      // The SDK provides user transcripts through onMessage with source 'user'
      // We also handle it via a polling approach for audio level visualization
      const audioLevelInterval = setInterval(() => {
        if (conversationRef.current) {
          try {
            const inputVolume = conversationRef.current.getInputVolume?.();
            const outputVolume = conversationRef.current.getOutputVolume?.();
            if (typeof inputVolume === 'number') {
              setAudioLevel(Math.round(inputVolume * 100));
            }
          } catch (e) {
            // Volume methods may not be available
          }
        }
      }, 200);
 
      // Store interval for cleanup
      conversation._audioLevelInterval = audioLevelInterval;
 
    } catch (err) {
      setError(err.message || 'Failed to start voice interview');
      console.error('Error starting interview:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [interviewId, candidateId, durationTracker]);
 
  /**
   * Stop the voice interview.
   * 1. End ElevenLabs conversation
   * 2. Send collected transcripts to backend
   */
  const stopInterview = useCallback(async () => {
    try {
      setIsProcessing(true);
      durationTracker.stop();
 
      // End ElevenLabs conversation
      if (conversationRef.current) {
        // Clear audio level interval
        if (conversationRef.current._audioLevelInterval) {
          clearInterval(conversationRef.current._audioLevelInterval);
        }
 
        try {
          await conversationRef.current.endSession();
        } catch (e) {
          console.error('Error ending ElevenLabs session:', e);
        }
        conversationRef.current = null;
      }
 
      setIsRecording(false);
 
      if (voiceSession) {
        // Send transcript data to backend for analysis
        const completedSession = await voiceInterviewService.completeVoiceInterview(
          voiceSession.session_id,
          durationTracker.duration,
          transcriptDataRef.current
        );
 
        setVoiceSession(completedSession);
        setStatus('completed');
        setResults(completedSession);
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
  }, []);
 
  const handleAudioLevelChange = useCallback((level) => {
    setAudioLevel(level);
  }, []);
 
  const handleRecordingStateChange = useCallback((isRecordingState) => {
    setIsRecording(isRecordingState);
  }, []);
 
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
                  <span className="text-sm font-medium">WebRTC Connected</span>
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
 
 