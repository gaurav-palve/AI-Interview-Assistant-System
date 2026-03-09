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
import {
  Home as HomeIcon,
  QuestionAnswer as QuestionIcon,
  Mic as MicMuiIcon,
  School as SchoolIcon,
  Check as CheckMuiIcon,
  ArrowForward as ArrowForwardIcon,
  Info as InfoIcon,
  Menu as MenuIcon,
  Code as CodeIcon,
  GraphicEq as GraphicEqIcon
} from '@mui/icons-material';

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
  const [processingAction, setProcessingAction] = useState(null); // 'ending' | 'submitting' | null
  const [connectionQuality, setConnectionQuality] = useState('excellent');
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [fallbackReason, setFallbackReason] = useState('');

  const [userMessage, setUserMessage] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [interviewProgress, setInterviewProgress] = useState(0);
  const [cameraReady, setCameraReady] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs for ElevenLabs conversation
  const conversationRef = useRef(null);
  const transcriptDataRef = useRef([]); // Collects {role, text} for backend
  const hasStartedRef = useRef(false);

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

  const formattedDuration = useMemo(() => {
    const hours = Math.floor(durationTracker.duration / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((durationTracker.duration % 3600) / 60).toString().padStart(2, '0');
    const seconds = (durationTracker.duration % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }, [durationTracker.duration]);

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
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

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
          // The SDK might send text in message.message or message.text or message.transcript
          const text = message.message || message.text || (message.transcript && typeof message.transcript === 'string' ? message.transcript : null);

          if (text) {
            const role = message.source === 'ai' ? 'agent' : 'user';
            const label = message.source === 'ai' ? 'AI: ' : 'You: ';

            transcriptDataRef.current.push({ role, text });
            setTranscript(prev =>
              prev + (prev ? '\n\n' : '') + label + text
            );

            if (message.source === 'ai') {
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
      hasStartedRef.current = false;
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
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
      setProcessingAction(null);
    }
  }, [voiceSession, durationTracker]);

  const handleInterviewComplete = useCallback(() => {
    stopInterview();
  }, [stopInterview]);

  // Auto-start interview when everything is ready
  useEffect(() => {
    if (status === 'pending' && interview && candidateId && !hasStartedRef.current) {
      console.log('Auto-starting voice interview session...');
      startInterview();
    }
  }, [status, interview, candidateId, startInterview]);

  const handleRecordingComplete = useCallback((audioBlob) => {
    console.log('Recording completed:', audioBlob);
  }, []);

  const handleAudioLevelChange = useCallback((level) => {
    setAudioLevel(level);
  }, []);

  const handleRecordingStateChange = useCallback((isRecordingState) => {
    setIsRecording(isRecordingState);
  }, []);

  const sendTextMessage = useCallback(async () => {
    if (!userMessage.trim()) return;

    try {
      setTranscript(prev => prev + (prev ? '\n\n' : '') + 'You: ' + userMessage);
      setUserMessage('');
      // In a real scenario, this would send to the backend/AI
      console.log('Text message sent:', userMessage);
    } catch (err) {
      console.error('Error sending text message:', err);
    }
  }, [userMessage]);

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
      <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="text-center relative z-10">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-white/60">Loading interview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !interview) {
    return (
      <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h2 className="text-lg font-semibold text-red-200 mb-2">Error</h2>
              <p className="text-red-100">{error}</p>
              <button
                onClick={() => navigate(-1)}
                className="mt-4 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
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
    <div className="flex h-screen bg-[#020617] text-gray-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 bg-[#081433] border-r border-white/5 flex flex-shrink-0 flex-col py-6 px-6">
        <div className="px-6 flex items-center gap-2 mb-10">
          <span className="text-white font-bold text-lg tracking-tight">RecruitIQ</span>
        </div>

        <nav className="space-y-1">
          {[
            { label: 'Dashboard', icon: HomeIcon, active: false },
            { label: 'Technical Assessment', icon: SchoolIcon, active: false },
            { label: 'Voice Interview', icon: MicMuiIcon, active: true },
            { label: 'Coding Round', icon: QuestionIcon, active: false }
          ].map((item, idx) => (
            <div
              key={idx}
              className={`py-2 px-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer ${item.active ? 'bg-[#0E1E4C] text-white border-l-2 border-white shadow-sm' : 'text-white hover:text-white'}`}
            >
              <item.icon sx={{ fontSize: 16 }} />
              <span className="text-[12px] font-medium">{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden bg-[#050D27]">
        {/* Header */}
        <header className="h-12 bg-[#08143382] border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0 z-10">
          <div />
          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-[13px] font-bold text-white">Hello, {interview?.candidate_name?.split(' ')[0] || 'Candidate'}</p>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Candidate</p>
              </div>
              <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-gray-400 border border-white/10">
                <MenuIcon sx={{ fontSize: 16 }} />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Assessment Content */}
        <div className="px-12 flex-1 overflow-y-auto w-full">
          <main className={`p-6 ${status === 'completed' ? 'p-2' : ''} max-w-6xl mx-auto w-full flex flex-col items-center`}>
            {/* Page Heading */}
            <div className={`w-full ${status === 'completed' ? 'mb-3' : 'mb-4'}`}>
              <div className="flex items-baseline gap-3 mb-1">
                <h1 className="text-2xl font-semibold text-white tracking-tight">AI Voice Round</h1>
                <span className="text-white text-[11px] font-normal">8–10 questions evaluated by our AI interview model</span>
              </div>
            </div>

            {/* Progress Tracker */}
            <div className={`flex items-center justify-between w-full relative px-0 ${status === 'completed' ? 'mb-2' : 'mb-8'}`}>
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#1E293B] -translate-y-1/2 z-0" />
              {[
                { num: 1, label: 'Details', state: 'completed' },
                { num: 2, label: 'Technical', state: 'completed' },
                { num: 3, label: 'Voice', state: status === 'completed' ? 'completed' : 'active' },
                { num: 4, label: 'Coding', state: status === 'completed' ? 'active' : 'pending' }
              ].map((step, idx) => (
                <div key={idx} className={`flex items-center gap-2 z-10 bg-[#050D27] ${idx === 0 ? 'pr-2' : idx === 3 ? 'pl-2' : 'px-2'}`}>
                  {step.state === 'completed' ? (
                    <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center text-white ring-1 ring-white shadow-lg">
                      <CheckMuiIcon sx={{ fontSize: 11 }} />
                    </div>
                  ) : (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[8px] shadow-lg transition-all ${step.state === 'active' ? 'bg-[#2563EB] text-white ring-1 ring-white' : 'bg-[#0B1739] text-gray-400 border border-white/5'
                      }`}>
                      {step.num}
                    </div>
                  )}
                  <span className={`text-[9px] font-bold tracking-tight ${step.state === 'active' ? 'text-white' : step.state === 'completed' ? 'text-white' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {status === 'completed' && results ? (
              <div className={`w-full max-w-4xl bg-[#050D27] space-y-8 ${fadeInUp}`}>
                <VoiceInterviewResults
                  results={results}
                  onDownloadTranscript={downloadTranscript}
                  interviewId={interviewId}
                />
              </div>
            ) : (
              <>

                {/* Assessment Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-1 w-full items-start flex-1 min-h-0 min-w-0">
                  {/* Left Column: Live Transcript */}
                  <div className="md:col-span-8 flex flex-col h-[calc(100vh-210px)] overflow-hidden relative">
                    <TranscriptDisplay
                      transcript={transcript}
                      isLive={status === 'active'}
                      duration={formattedDuration}
                      aiThinking={aiThinking}
                      className="h-full"
                    />
                  </div>

                  {/* Right Column: Camera & Visualizer */}
                  <div className="md:col-span-4 md:ml-auto space-y-4 flex flex-col h-[calc(100vh-210px)]">
                    {/* Camera preview */}
                    <div className="w-60 h-29 aspect-video md:aspect-auto md:flex-1 rounded-md bg-[#0F172A] border border-[#1E293B] overflow-hidden shadow-xl relative group min-h-0">
                      {cameraReady && (
                        <CameraProctorNew
                          autoStart={true}
                          sessionId={interviewId}
                          hideControls={true}
                          onCheatingDetected={handleCheatingDetected}
                        />
                      )}
                      <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[9px] font-bold text-white uppercase tracking-tighter">Live Camera</span>
                      </div>
                    </div>

                    {/* AI Visualizer */}
                    <div className="w-60 h-29 aspect-video md:aspect-auto md:flex-1 rounded-md bg-[#0F172A] border border-[#1E293B] flex items-center justify-center overflow-hidden shadow-xl relative group min-h-0">
                      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center ${aiThinking || isRecording ? 'animate-pulse' : ''} shadow-[0_0_50px_rgba(168,85,247,0.3)]`}>
                        <GraphicEqIcon sx={{ fontSize: 30, color: 'white' }} />
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MicMuiIcon sx={{ fontSize: 12, color: '#3B82F6' }} />
                        <span className="text-[9px] font-bold text-white uppercase tracking-tighter">AI Assistant</span>
                      </div>
                    </div>

                    <div className="space-y-4 flex-shrink-0">
                      {(status === 'active' || status === 'pending' || status === 'ended') && (
                        <button
                          onClick={() => {
                            setProcessingAction('ending');
                            stopInterview();
                          }}
                          disabled={isProcessing || status === 'ended'}
                          className="w-60 h-8 rounded-md outline outline-1 outline-offset-[-1px] outline-red-600 font-semibold text-[10px] text-red-600 hover:bg-[#7F1D1D]/20 transition-all tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingAction === 'ending' ? 'Ending...' : 'End Voice Interview'}
                        </button>
                      )}

                      {(status === 'active' || status === 'pending' || status === 'ended') && (
                        <button
                          onClick={() => {
                            setProcessingAction('submitting');
                            stopInterview();
                          }}
                          disabled={isProcessing}
                          className="w-60 h-10 bg-[#2563EB] text-white rounded-[6px] font-semibold text-[13px] shadow-[0px_0px_16px_0px_rgba(37,99,235,0.80)] hover:bg-blue-700 transition-all flex items-center justify-center gap-2 wider disabled:opacity-50"
                        >
                          {processingAction === 'submitting' ? 'Submitting...' : 'Submit Voice Interview'}
                          <ArrowForwardIcon sx={{ fontSize: 13 }} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fallback View */}
                {isFallbackMode && status === 'active' && (
                  <div className="w-full mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex gap-4 items-center animate-fadeIn">
                    <AlertCircle className="text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-yellow-500">Fallback Mode Active</p>
                      <p className="text-xs text-yellow-500/80">{fallbackReason}</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        className="bg-black/20 border border-white/10 rounded px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500 text-white"
                        placeholder="Type response..."
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
                      />
                      <button onClick={sendTextMessage} className="bg-yellow-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-yellow-700 transition-colors">Send</button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* CSS for animations */}
            <style dangerouslySetInnerHTML={{
              __html: `
              @keyframes slideIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes wave {
                0%, 100% { height: 20%; }
                50% { height: 100%; }
              }
              .animate-wave {
                animation: wave 1s ease-in-out infinite;
              }
              .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #1E293B;
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #334155;
              }
            `}} />
          </main>
        </div>
      </div>



      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default React.memo(VoiceInterview);

