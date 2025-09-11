import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import interviewService from '../services/interviewService';
import CameraProctor from '../components/CameraProctor';
import { useCamera } from '../contexts/CameraContext';

// Material UI Icons import using lucide-react (matching voice interview styling)
import { Clock, Mic, ArrowRight, AlertCircle, Brain, Loader2, Volume2, Camera } from 'lucide-react';

/**
 * VoiceInterviewInstructions page component
 * Provides instructions and a countdown timer before the voice interview
 */
function VoiceInterviewInstructions() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [instructionTimer, setInstructionTimer] = useState(60); // 60 seconds countdown
  const timerRef = useRef(null);
  const { startCamera } = useCamera();

  // Fetch interview details on component mount
  useEffect(() => {
    const fetchInterview = async () => {
      console.info(`[VoiceInterviewInstructions] Fetching interview with ID: ${interviewId}`);
      try {
        setLoading(true);
        const data = await interviewService.getCandidateInterview(interviewId);
        console.info('[VoiceInterviewInstructions] Interview data retrieved successfully', data);
        setInterview(data);
        setError(null);
      } catch (err) {
        console.error('[VoiceInterviewInstructions] Error fetching interview', err);
        setError(err.detail || 'Failed to load interview details. Please check your interview link.');
      } finally {
        setLoading(false);
      }
    };

    if (interviewId && !interview) {  // Only fetch if we don't already have interview data
      fetchInterview();
    }
    // Start camera
    startCamera();
    
    return () => {
      // Camera will be managed by the context
    };
  }, [interviewId, startCamera, interview]);

  // Timer effect for instruction reading
  useEffect(() => {
    if (instructionTimer > 0) {
      timerRef.current = setTimeout(() => {
        setInstructionTimer(instructionTimer - 1);
      }, 1000);
    } else if (instructionTimer === 0) {
      // Timer finished, redirect to voice interview
      // Camera will stay active during navigation
      navigate(`/voice-interview/${interviewId}`);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [instructionTimer, interviewId, navigate]);

  // Format time for display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render loading state
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
          <p className="text-white/60">Loading voice interview instructions...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
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
                  Voice Interview Preparation
                </h1>
                {interview && (
                  <p className="text-white/60 mt-1">{interview.job_role || "Technical Interview"}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Timer */}
              <div className="flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />
                <span className="font-mono text-sm font-bold">
                  {formatTime(instructionTimer)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Instructions */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Volume2 className="mr-3 h-6 w-6 text-purple-400" />
                Voice Interview Instructions
              </h2>
              
              <div className="space-y-6">
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-lg font-semibold text-purple-300 mb-2 flex items-center">
                    <Brain className="mr-2 h-5 w-5" />
                    What to Expect
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    You're about to begin an AI-powered voice interview. You'll interact with an AI interviewer that will ask you technical questions related to the position. Speak clearly and concisely when answering questions.
                  </p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-lg font-semibold text-purple-300 mb-2 flex items-center">
                    <Mic className="mr-2 h-5 w-5" />
                    How It Works
                  </h3>
                  <ul className="text-white/80 space-y-2 ml-5 list-disc">
                    <li>The AI will ask you a series of technical questions</li>
                    <li>Answer each question to the best of your ability</li>
                    <li>Your responses will be transcribed and analyzed</li>
                    <li>Camera proctoring will continue throughout the interview</li>
                    <li>The interview will last approximately 15-20 minutes</li>
                  </ul>
                </div>
                
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-lg font-semibold text-purple-300 mb-2 flex items-center">
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Tips for Success
                  </h3>
                  <ul className="text-white/80 space-y-2 ml-5 list-disc">
                    <li>Speak clearly and at a moderate pace</li>
                    <li>Take a moment to gather your thoughts before answering</li>
                    <li>Provide examples when possible to illustrate your points</li>
                    <li>If you don't know an answer, it's okay to say so</li>
                    <li>Stay relaxed and approach each question thoughtfully</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 bg-blue-500/20 rounded-xl p-5 border border-blue-400/30">
                <p className="text-white text-center">
                  Your voice interview will begin automatically in <span className="font-bold">{formatTime(instructionTimer)}</span>
                </p>
              </div>
            </div>
          </div>
          {/* Camera Preview */}
          
          <div className="relative aspect-video overflow-hidden bg-black/30 mb-4 rounded-lg shadow-inner">
                <div className="w-full h-full">
                  <CameraProctor
                    detectionEnabled={false} // Disable detection on instructions page
                  />
                </div>
              </div>
          
          {/* Removed duplicate camera component */}
        </div>
      </div>
    </div>
  );
}

export default VoiceInterviewInstructions;