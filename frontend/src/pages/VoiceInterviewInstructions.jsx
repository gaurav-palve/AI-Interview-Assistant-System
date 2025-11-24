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
  const [instructionTimer, setInstructionTimer] = useState(20); // 60 seconds countdown
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

    {/* HEADER */}
    <header className="w-full px-10 py-6 flex justify-between items-center backdrop-blur-xl bg-white/5 border-b border-white/10 relative z-20">
      <h1 className="text-3xl text-purple-300 font-bold">Voice Interview Instructions</h1>

      {/* Timer */}
      <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
        <Clock className="w-5 h-5 text-yellow-400" />
        <span className="font-mono font-bold">{formatTime(instructionTimer)}</span>
      </div>
    </header>

    

    {/* MAIN CONTENT AREA */}
    <div className="w-full h-[calc(100vh-100px)] px-10 py-6 flex gap-10 relative z-10">

      {/* LEFT PANEL - Main Instructions */}
      <div className="w-1/2 bg-white/10 border border-white/10 rounded-2xl p-7 backdrop-blur-md overflow-hidden">

        <h2 className="text-2xl font-bold mb-6">Ready for Your Voice Interview?</h2>

        <div className="space-y-6 overflow-auto h-[calc(100%-80px)] pr-2">

          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <h3 className="text-lg font-semibold text-purple-300 flex items-center mb-2">
              <Brain className="mr-2 h-5 w-5" /> What to Expect
            </h3>
            <p className="text-white/80">
              You're about to begin an AI-powered voice interview. You'll interact with an AI
              interviewer who will ask you technical questions. Speak clearly and confidently.
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <h3 className="text-lg font-semibold text-purple-300 flex items-center mb-2">
              <Mic className="mr-2 h-5 w-5" /> How It Works
            </h3>
            <ul className="text-white/80 space-y-2 ml-5 list-disc">
              <li>The AI will ask you a series of technical questions</li>
              <li>Answer each question confidently and clearly</li>
              <li>Your responses are transcribed and analyzed</li>
              <li>Camera proctoring stays active throughout</li>
              <li>Total interview time: 15–20 mins</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <h3 className="text-lg font-semibold text-purple-300 flex items-center mb-2">
              <ArrowRight className="mr-2 h-5 w-5" /> Tips for Success
            </h3>
            <ul className="text-white/80 space-y-2 ml-5 list-disc">
              <li>Speak clearly and at normal pace</li>
              <li>Take a moment before answering</li>
              <li>Give examples when possible</li>
              <li>If unsure, answer honestly</li>
              <li>Stay calm and confident</li>
            </ul>
          </div>

        </div>

      </div>

      {/* RIGHT PANEL */}
      <div className="w-1/2 flex flex-col gap-6">

        {/* CAMERA FIXED TOP RIGHT (Just Below Timer) */}
        <div className="absolute right-10 top-[60px] w-56 h-56 rounded-lg overflow-hidden z-30">
          <CameraProctor detectionEnabled={false} />
        </div>

        {/* Guidelines Box */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-md">
          <h3 className="font-semibold text-purple-300 mb-3">Key Guidelines</h3>
          <ul className="text-white/80 space-y-2 ml-5 list-disc">
            <li>Ensure stable internet connection</li>
            <li>Keep your face clearly visible</li>
            <li>Avoid background noise</li>
            <li>Stay focused and avoid moving away</li>
          </ul>
        </div>

        {/* Footer Timer */}
        <div className="bg-purple-900 py-4 text-center border border-blue-400/20 rounded-xl text-white font-medium">
          🎤 Interview begins automatically in <b>{formatTime(instructionTimer)}</b>
        </div>

      </div>
    </div>
  </div>
);

}

export default VoiceInterviewInstructions;








 