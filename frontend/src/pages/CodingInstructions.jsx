import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from '@chakra-ui/react';
import { Code, Clock, Brain, Zap, Target, Shield } from 'lucide-react';
import { generateCodingQuestions } from "../services/codingService";
import CameraProctorNew from '../components/CameraProctorNew';

function CodingInstructions() {
  const navigate = useNavigate();
  const { interviewId } = useParams();
  const toast = useToast();
  const [instructionTimer, setInstructionTimer] = useState(30);
  const [cameraReady, setCameraReady] = useState(false);
  const requestMadeRef = useRef(false);

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

  // -------------------------------
  // GENERATE CODING QUESTIONS (NO TOASTS)
  // -------------------------------
  useEffect(() => {
    const generateQuestions = async () => {
      if (!interviewId || interviewId === "default") return;
      if (requestMadeRef.current) return;

      requestMadeRef.current = true;

      try {
        await generateCodingQuestions(interviewId, 3, "medium");
      } catch (error) {
        requestMadeRef.current = false;
      }
    };

    generateQuestions();
    // Auto-start camera on component mount
    setCameraReady(true);
  }, [interviewId]);

  // -------------------------------
  // COUNTDOWN + REDIRECT
  // -------------------------------
  useEffect(() => {
    if (instructionTimer > 0) {
      const timer = setTimeout(() => {
        setInstructionTimer((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      navigate(`/leetcode/${interviewId}`);
    }
  }, [instructionTimer, navigate, interviewId]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden flex flex-col">
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Code className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold">Coding Round</h1>
            </div>

            <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full px-5 py-2.5 border border-blue-400/30">
              <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />
              <span className="font-mono text-xl font-bold">{formatTime(instructionTimer)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Camera Component */}
      {cameraReady && (
        <CameraProctorNew 
          autoStart={true} 
          sessionId={interviewId} 
          hideControls={true} 
          onCheatingDetected={handleCheatingDetected} 
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="max-w-5xl w-full">

          {/* Hero */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Ready to Code?
            </h2>
            <p className="text-white/70 text-lg">
              Demonstrate your problem-solving skills with 3 challenging problems
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:border-blue-400/50 transition-all duration-300 hover:bg-white/10">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg mb-4 mx-auto">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">3 Problems</h3>
              <p className="text-white/70 text-sm text-center">
                Tailored to your role and experience level
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:border-indigo-400/50 transition-all duration-300 hover:bg-white/10">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-500/20 rounded-lg mb-4 mx-auto">
                <Brain className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">Any Language</h3>
              <p className="text-white/70 text-sm text-center">
                Use your preferred programming language
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:border-purple-400/50 transition-all duration-300 hover:bg-white/10">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-lg mb-4 mx-auto">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">Real-time Test</h3>
              <p className="text-white/70 text-sm text-center">
                Run and validate your code instantly
              </p>
            </div>
          </div>

          {/* Key Instructions */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 mb-6">
            <div className="flex items-center mb-4">
              <Shield className="w-5 h-5 text-green-400 mr-2" />
              <h3 className="text-lg font-semibold">Key Guidelines</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <Instruction text="Write clean, optimized, and readable code" />
              <Instruction text="Evaluated on correctness and performance" />
              <Instruction text="Handle edge cases thoughtfully" />
              <Instruction text="Avoid switching tabs frequently" />
              <Instruction text="Solve problems in any order you prefer" />
              <Instruction text="Submit before time runs out" />
            </div>
          </div>

          {/* Auto Start Banner */}
          <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl p-4 border border-blue-400/30 backdrop-blur-md">
            <p className="text-white text-center text-lg">
              🚀 Round begins automatically in{" "}
              <span className="font-bold text-yellow-400">{formatTime(instructionTimer)}</span>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

function Instruction({ text }) {
  return (
    <div className="flex items-start">
      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
      <p className="text-white/80 text-sm">{text}</p>
    </div>
  );
}

export default CodingInstructions; 
