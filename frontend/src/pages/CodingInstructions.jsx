import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Code, Clock, ArrowRight, Brain } from 'lucide-react';
import { generateCodingQuestions } from '../services/codingService';
import { useToast } from '@chakra-ui/react';

function CodingInstructions() {
  const navigate = useNavigate();
  const { interviewId } = useParams();
  const [instructionTimer, setInstructionTimer] = useState(30);
  const timerRef = useRef(null);

  const [questionsGenerated, setQuestionsGenerated] = useState(false);
  const toast = useToast();
  const requestMadeRef = useRef(false);

  useEffect(() => {
    if (!interviewId) {
      toast({
        title: "Error",
        description: "No interview ID provided. Please check the URL.",
        status: "error",
        duration: 5000,
      });
      return;
    }
  }, [interviewId, toast]);

  useEffect(() => {
    const generateQuestions = async () => {
      if (!interviewId || interviewId === "default") return;

      if (requestMadeRef.current) return;

      try {
        requestMadeRef.current = true;

        await generateCodingQuestions(interviewId, 3, "medium");

        setQuestionsGenerated(true);

        toast({
          title: "Coding Questions Ready",
          description: "Your coding questions have been generated.",
          status: "success",
          duration: 3000,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to generate questions: ${error.message}`,
          status: "error",
          duration: 4000,
        });

        requestMadeRef.current = false;
      }
    };

    generateQuestions();
  }, [interviewId, toast]);

  useEffect(() => {
    if (!interviewId || interviewId === "default") return;

    if (instructionTimer > 0) {
      timerRef.current = setTimeout(() => {
        setInstructionTimer((prev) => prev - 1);
      }, 1000);
    } else {
      navigate(`/leetcode/${interviewId}`);
    }

    return () => clearTimeout(timerRef.current);
  }, [instructionTimer, interviewId, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl bg-white/10 border-b border-white/20 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Coding Round Preparation</h1>
            </div>

            <div className="flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2">
              <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />
              <span className="font-mono text-sm font-bold">{formatTime(instructionTimer)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Code className="mr-3 h-6 w-6 text-blue-400" />
            Coding Round Instructions
          </h2>

          <div className="space-y-6">

            {/* What to Expect */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-lg font-semibold text-blue-300 mb-2 flex items-center">
                <Brain className="mr-2 h-5 w-5" />
                What to Expect
              </h3>
              <p className="text-white/80 leading-relaxed">
                You will be given coding problems. Write clean and efficient code.
              </p>
            </div>

            {/* Full Coding Instructions */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 className="text-lg font-semibold text-blue-300 mb-2">Instructions for the Coding Round</h3>
              <ul className="list-disc list-inside space-y-2 text-white/80 leading-relaxed">
                <li>You will receive <strong>3 coding problems</strong> generated based on your job role and resume.</li>
                <li>You can solve the problems in any order using your preferred programming language.</li>
                <li>Write clean, optimized, and readable code — avoid unnecessary complexity.</li>
                <li>Your code will be evaluated on <strong>correctness, performance, and edge-case handling</strong>.</li>
                <li>The editor supports running your code with sample test cases.</li>
                <li>You cannot go back to previous rounds once this round starts.</li>
                <li>Avoid switching tabs or windows repeatedly; it may be auto-flagged.</li>
                <li>Submit your final code before time runs out to ensure evaluation.</li>
              </ul>
            </div>

            {/* Auto Start */}
            <div className="bg-blue-500/20 rounded-xl p-5 border border-blue-400/30 mt-6">
              <p className="text-white text-center">
                Your coding round will begin automatically in{" "}
                <span className="font-bold">{formatTime(instructionTimer)}</span>
              </p>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}

export default CodingInstructions;

 