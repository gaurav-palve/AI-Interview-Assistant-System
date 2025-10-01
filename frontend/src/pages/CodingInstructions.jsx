import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Code, Clock, ArrowRight, AlertCircle, Brain, Loader2 } from 'lucide-react';
import { generateCodingQuestions } from '../services/codingService';
import { useToast } from '@chakra-ui/react';

/**
 * CodingInstructions page component
 * Provides instructions and a countdown timer before the coding round
 * Generates coding questions when the page loads
 */
function CodingInstructions() {
  const navigate = useNavigate();
  const { interviewId } = useParams();
  const [instructionTimer, setInstructionTimer] = useState(30); // 30 seconds countdown
  const timerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);
  const toast = useToast();
  const requestMadeRef = useRef(false); // Ref to track if request has been made

  // Log the interview ID
  useEffect(() => {
    console.log("CodingInstructions component mounted with interviewId:", interviewId);
    
    // Don't modify the interview_id at all - use exactly what's in the URL
    // This is the MongoDB ObjectId format like "68db8801735747049bd7952d"
    if (!interviewId) {
      console.log("No interview ID provided");
      toast({
        title: "Error",
        description: "No interview ID provided. Please check the URL.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
  }, [interviewId, navigate, toast]);

  useEffect(() => {
    const generateQuestions = async () => {
      // Skip if interview ID is invalid (will be handled by the other useEffect)
      if (interviewId === "default" || !interviewId) {
        return;
      }
      
      // Prevent duplicate requests (React StrictMode causes double mount in development)
      if (requestMadeRef.current) {
        console.log("Skipping duplicate request");
        return;
      }

      try {
        // Mark that we've made the request
        requestMadeRef.current = true;
        
        // Debug the interview ID
        console.log("Generating questions with interview ID:", interviewId);
        
        // Generate questions for this interview
        const result = await generateCodingQuestions(interviewId, 3, 'medium');
        setQuestionsGenerated(true);
        toast({
          title: "Questions generated",
          description: "Coding questions have been generated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error("Error generating questions:", error);
        toast({
          title: "Error",
          description: `Failed to generate questions: ${error.message}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        // Reset the request flag on error so we can try again
        requestMadeRef.current = false;
      } finally {
        setLoading(false);
      }
    };

    generateQuestions();
  }, [interviewId, toast]);

  // Timer effect for instruction reading
  useEffect(() => {
    // Skip timer if interview ID is invalid
    if (interviewId === "default" || !interviewId) {
      return;
    }
    
    if (instructionTimer > 0) {
      timerRef.current = setTimeout(() => {
        setInstructionTimer(instructionTimer - 1);
      }, 1000);
    } else if (instructionTimer === 0) {
      // Timer finished, redirect to coding round with the exact same interview ID from the URL
      console.log("Timer finished, redirecting to LeetCode with interview ID:", interviewId);
      navigate(`/leetcode/${interviewId}`);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [instructionTimer, navigate, interviewId]);

  // Format time for display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="text-center relative z-10">
          <Loader2 className="animate-spin h-12 w-12 text-blue-400 mx-auto mb-4" />
          <p className="text-white/60">Loading coding round instructions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-500/5 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      {/* Glassmorphism Header */}
      <header className="relative z-10 backdrop-blur-xl bg-white/10 border-b border-white/20 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Coding Round Preparation
                </h1>
                <p className="text-white/60 mt-1">Technical Assessment</p>
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
          <div className="lg:col-span-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Code className="mr-3 h-6 w-6 text-blue-400" />
                Coding Round Instructions
              </h2>
              
              <div className="space-y-6">
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-lg font-semibold text-blue-300 mb-2 flex items-center">
                    <Brain className="mr-2 h-5 w-5" />
                    What to Expect
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    You're about to begin the coding assessment round. You'll be presented with programming problems to solve. Write efficient, clean code that correctly addresses the requirements of each problem.
                  </p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-lg font-semibold text-blue-300 mb-2 flex items-center">
                    <Code className="mr-2 h-5 w-5" />
                    How It Works
                  </h3>
                  <ul className="text-white/80 space-y-2 ml-5 list-disc">
                    <li>You'll be presented with coding problems of varying difficulty</li>
                    <li>Read each problem statement carefully before coding</li>
                    <li>You can select your preferred programming language</li>
                    <li>Test your solution with the provided test cases</li>
                    <li>Submit your solution when you're confident it works correctly</li>
                  </ul>
                </div>
                
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <h3 className="text-lg font-semibold text-blue-300 mb-2 flex items-center">
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Tips for Success
                  </h3>
                  <ul className="text-white/80 space-y-2 ml-5 list-disc">
                    <li>Start by understanding the problem completely</li>
                    <li>Consider edge cases in your solution</li>
                    <li>Optimize your code for time and space complexity</li>
                    <li>Use meaningful variable names and add comments</li>
                    <li>Test your solution with different inputs before submitting</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 bg-blue-500/20 rounded-xl p-5 border border-blue-400/30">
                <p className="text-white text-center">
                  Your coding round will begin automatically in <span className="font-bold">{formatTime(instructionTimer)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodingInstructions;