import { useState, useEffect, useRef } from 'react';
import sharedImage from '../shared image.png';
import { useParams, useNavigate } from 'react-router-dom';
import interviewService from '../services/interviewService';
import CameraProctor from '../components/CameraProctor';
import { useCamera } from '../contexts/CameraContext';
// Custom logger for better debugging
const logger = {
  info: (message, data) => {
    console.info(`[CandidateInterview] INFO: ${message}`, data || '');
  },
  error: (message, error) => {
    console.error(`[CandidateInterview] ERROR: ${message}`, error || '');
  },
  warn: (message, data) => {
    console.warn(`[CandidateInterview] WARNING: ${message}`, data || '');
  },
  debug: (message, data) => {
    console.debug(`[CandidateInterview] DEBUG: ${message}`, data || '');
  }
};

// Material UI Icons
import {
  PlayArrow as PlayIcon,
  NavigateNext as NextIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Timer as TimerIcon,
  QuestionAnswer as QuestionIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Videocam as VideocamIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

// Logo component removed

/**
 * CandidateInterview page component
 * Displays interview instructions and MCQs for candidates
 */
function CandidateInterview() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState('instructions'); // 'instructions', 'waiting', 'mcq', 'completed'
  const [mcqs, setMcqs] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);
  const [generatingMcqs, setGeneratingMcqs] = useState(false);
  const [instructionTimer, setInstructionTimer] = useState(60); // 1 minute in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [mcqsGenerated, setMcqsGenerated] = useState(false);
  const [mcqTimer, setMcqTimer] = useState(3600); // 1 hour in seconds for the MCQ test
  const [mcqTimerActive, setMcqTimerActive] = useState(false);
  const timerRef = useRef(null);
  const mcqTimerRef = useRef(null);
  const { startCamera, stopCamera, isActive } = useCamera();

  // Fetch interview details on component mount
  useEffect(() => {
    const fetchInterview = async () => {
      logger.info(`Fetching interview with ID: ${interviewId}`);
      try {
        setLoading(true);
        const data = await interviewService.getCandidateInterview(interviewId);
        logger.info('Interview data retrieved successfully', data);
        setInterview(data);
        
        // Check if MCQs are already ready based on the mcqs_status field
        if (data.mcqs_status === 'ready') {
          logger.info('MCQs are already ready according to interview data');
          // We'll still call generateMcqsInBackground to fetch the actual MCQs,
          // but we know they're ready
          setMcqsGenerated(true);
        }
        
        setError(null);
      } catch (err) {
        logger.error('Error fetching interview', err);
        setError(err.detail || 'Failed to load interview details. Please check your interview link.');
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      fetchInterview();
      // Start instruction timer automatically when component mounts
      setTimerActive(true);
      // Start MCQ generation in the background
      generateMcqsInBackground();
      // Start camera
      startCamera();
    }
  }, [interviewId]);

  // Timer effect for instruction reading
  useEffect(() => {
    if (timerActive && instructionTimer > 0) {
      timerRef.current = setTimeout(() => {
        setInstructionTimer(instructionTimer - 1);
      }, 1000);
    } else if (timerActive && instructionTimer === 0) {
      // Timer finished, show MCQs if they're generated
      if (mcqsGenerated) {
        // Start the test without delay
        logger.info('Timer finished and MCQs are ready, starting MCQ phase');
        setPhase('mcq');
        // Start the MCQ timer
        setMcqTimerActive(true);
      } else {
        // Set phase to waiting if MCQs are not yet generated
        logger.info('Timer finished but MCQs are not ready yet, entering waiting phase');
        setPhase('waiting');
        
        // Try to generate MCQs again immediately
        generateMcqsInBackground();
      }
      setTimerActive(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timerActive, instructionTimer, mcqsGenerated]);

  // Effect to poll for MCQ status when in waiting phase
  useEffect(() => {
    let pollInterval = null;
    
    if (phase === 'waiting' && !mcqsGenerated) {
      logger.info('Starting polling for MCQ status');
      
      // Poll every 3 seconds
      pollInterval = setInterval(async () => {
        try {
          logger.info('Polling for MCQs');
          // Try to generate/fetch MCQs again
          const response = await interviewService.generateCandidateMCQs(interviewId);
          
          if (response && response.length > 0) {
            logger.info('MCQs fetched successfully during polling', { responseLength: response.length });
            
            // Parse MCQs from response
            const parsedMcqs = parseMcqs(response);
            logger.info('MCQs parsed successfully during polling', {
              count: parsedMcqs.length,
              firstQuestion: parsedMcqs[0]?.question
            });
            
            setMcqs(parsedMcqs);
            setMcqsGenerated(true);
            setPhase('mcq');
            setCurrentQuestionIndex(0);
            setMcqTimerActive(true);
          }
        } catch (err) {
          logger.error('Error polling for MCQs', err);
          // Don't set error state here to avoid disrupting the UI
        }
      }, 3000);
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [phase, mcqsGenerated, interviewId]);

  // Effect to check interview status and redirect to voice interview if needed
  useEffect(() => {
    const checkInterviewStatus = async () => {
      if (!completed || !interview) return; // Only run when completed is true and interview exists
      
      try {
        // Fetch the latest interview status
        const data = await interviewService.getCandidateInterview(interviewId);
        logger.info('Checking interview status after MCQ completion', data);
        
        // If status is mcq_completed, redirect to voice interview
        if (data.status === "mcq_completed") {
          logger.info('MCQs completed, redirecting to voice interview instructions');
          // Redirect to voice interview instructions page
          navigate(`/voice-interview-instructions/${interviewId}`);
        }
      } catch (err) {
        logger.error('Error checking interview status', err);
      }
    };
    checkInterviewStatus();
  }, [completed, interviewId, navigate, interview]);
  
  // Stop camera when component unmounts
  useEffect(() => {
    return () => {
      // Don't stop camera here - it will be managed by the context
    };
  }, []);

  /**
   * Start the instruction timer and begin MCQ generation in the background
   */
  // This function is now called automatically on component mount
  const handleStartInstructions = async () => {
    if (!interview) {
      logger.warn('Attempted to start interview but interview data is not loaded');
      return;
    }

    logger.info('Starting instruction timer and MCQ generation', {
      interviewId,
      candidateName: interview.candidate_name,
      candidateEmail: interview.candidate_email
    });
    
    // Start the timer
    setTimerActive(true);

    
    // Log that the instructions have started
    logger.info('Starting instruction timer');
  };

  /**
   * Generate MCQs in the background while the candidate reads instructions
   */
  const generateMcqsInBackground = async () => {
    setGeneratingMcqs(true);
    setError(null);

    try {
      // Generate MCQs based on resume and job description
      logger.info('Generating MCQs for interview in background', { interviewId });
      const response = await interviewService.generateCandidateMCQs(interviewId);
      logger.info('MCQs generated successfully', { responseLength: response.length });
      
      // Parse MCQs from response
      logger.debug('Parsing MCQs from response');
      const parsedMcqs = parseMcqs(response);
      logger.info('MCQs parsed successfully', {
        count: parsedMcqs.length,
        firstQuestion: parsedMcqs[0]?.question
      });
      
      setMcqs(parsedMcqs);
      setMcqsGenerated(true);
      // If timer has already finished, start the interview
      if (instructionTimer === 0 || phase === 'waiting') {
        logger.info('Timer already finished, starting the interview with generated MCQs');
        setPhase('mcq');
        setCurrentQuestionIndex(0);
      }
    } catch (err) {
      logger.error('Error generating MCQs', err);
      setError(err.detail || 'Failed to generate interview questions. Please try again later.');
    } finally {
      setGeneratingMcqs(false);
    }
  };

  /**
   * Parse MCQs from the response text
   * @param {string} mcqText - Raw MCQ text
   * @returns {Array} - Array of parsed MCQ objects
   */
  const parseMcqs = (mcqText) => {
    // This is a parser for the MCQ format from the backend
    logger.debug('Parsing MCQ text', { textLength: mcqText.length });
    const questions = [];
    const lines = mcqText.split('\n');
    
    let currentQuestion = null;
    let currentOptions = [];
    let correctAnswer = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) continue;
      
      // Question line (starts with a number followed by a period)
      if (/^\d+\./.test(trimmedLine)) {
        // Save previous question if exists
        if (currentQuestion && currentOptions.length > 0) {
          questions.push({
            question: currentQuestion,
            options: currentOptions.map(opt => opt.replace(/^[a-d][\)\.]\s*/i, '')), // Remove option letter
            correctAnswer: correctAnswer
          });
        }
        
        // Start new question
        currentQuestion = trimmedLine;
        currentOptions = [];
        correctAnswer = null;
      }
      // Options (starts with a letter followed by a parenthesis or period)
      else if (/^[a-d][\)\.]/.test(trimmedLine.toLowerCase())) {
        currentOptions.push(trimmedLine);
      }
      // Answer line
      else if (/^answer:/i.test(trimmedLine)) {
        // Extract just the option text without the letter
        const answerMatch = trimmedLine.match(/^answer:\s*[a-d][\)\.]\s*(.*)/i);
        if (answerMatch && answerMatch[1]) {
          correctAnswer = answerMatch[1].trim();
        } else {
          correctAnswer = trimmedLine.replace(/^answer:\s*/i, '').trim();
        }
      }
    }
    
    // Add the last question
    if (currentQuestion && currentOptions.length > 0) {
      questions.push({
        question: currentQuestion,
        options: currentOptions.map(opt => opt.replace(/^[a-d][\)\.]\s*/i, '')), // Remove option letter
        correctAnswer: correctAnswer
      });
    }
    
    // Log the parsed questions for debugging
    logger.debug('Parsed MCQs', {
      count: questions.length,
      firstQuestion: questions[0]?.question,
      firstOptions: questions[0]?.options
    });
    
    return questions;
  };

  /**
   * Handle answer selection
   * @param {string} option - Selected option
   */
  const handleSelectAnswer = (option) => {
    logger.info('Answer selected', {
      questionIndex: currentQuestionIndex,
      selectedOption: option
    });
    
    setAnswers({
      ...answers,
      [currentQuestionIndex]: option
    });
  };

  /**
   * Move to the next question
   */
  const handleNextQuestion = async () => {
    logger.info('Moving to next question', {
      currentIndex: currentQuestionIndex,
      totalQuestions: mcqs.length,
      selectedAnswer: answers[currentQuestionIndex]
    });
    
    if (currentQuestionIndex < mcqs.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      logger.info('Advanced to next question', { newIndex: currentQuestionIndex + 1 });
    } else {
      logger.info('Interview completed', {
        totalQuestions: mcqs.length,
        answersCollected: Object.keys(answers).length
      });
      
      try {
        // Prepare responses for submission
        const responses = mcqs.map((mcq, index) => {
          const selectedAnswer = answers[index] || '';
          return {
            question: mcq.question,
            question_id: index + 1, // Add question_id (1-based index)
            selected_answer: selectedAnswer,
            correct_answer: mcq.correctAnswer || '',
            is_correct: selectedAnswer === mcq.correctAnswer
          };
        });
        
        // Calculate score
        const correctAnswers = responses.filter(r => r.is_correct).length;
        const totalScore = correctAnswers;
        const maxScore = mcqs.length;
        
        // Submit answers to backend
        logger.info('Submitting candidate answers to backend', {
          interviewId,
          totalScore,
          maxScore
        });
        
        await interviewService.submitCandidateAnswers(
          interviewId,
          interview.candidate_email,
          responses,
          totalScore,
          maxScore
        );
        
        logger.info('Answers submitted successfully');
      } catch (err) {
        logger.error('Error submitting answers', err);
        // Continue to completion screen even if submission fails
      }
      
      // Phase is completed, but camera stays active for voice interview
      setPhase('completed');
      setCompleted(true);
    }
  };

  /**
   * Get the current question
   * @returns {Object|null} - Current question object
   */
  const getCurrentQuestion = () => {
    if (!mcqs.length || currentQuestionIndex >= mcqs.length) return null;
    return mcqs[currentQuestionIndex];
  };

  /**
   * Check if an option is selected
   * @param {string} option - Option to check
   * @returns {boolean} - True if the option is selected
   */
  const isOptionSelected = (option) => {
    return answers[currentQuestionIndex] === option;
  };

  /**
   * Format the scheduled date for display
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date string
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format time for display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading Interview...</h2>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
        <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8 animate-fadeIn">
          <div className="flex items-center justify-center text-red-500 mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <WarningIcon className="h-12 w-12" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
            Error Loading Interview
          </h1>
          <p className="text-center text-gray-700 mb-8 px-4">
            {error}
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
            >
              <span className="mr-2">Try Again</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render interview not found state
  if (!interview) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
        <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8 animate-fadeIn">
          <div className="flex items-center justify-center text-yellow-500 mb-6">
            <div className="bg-yellow-100 p-3 rounded-full">
              <WarningIcon className="h-12 w-12" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
            Interview Not Found
          </h1>
          <p className="text-center text-gray-700 mb-6 px-4">
            The interview you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  
  // Render completed state
  if (phase === 'completed') {
    
    return (
      <div className="min-h-screen bg-neutrino-gradient text-white">
        {/* Header with Neutrino branding */}
        <header className="border-b border-gray-800">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-end items-center py-4 px-6">
              <button className="text-white p-2 rounded-full hover:bg-white/10">
                <MenuIcon />
              </button>
            </div>
          </div>
        </header>
        
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          {/* Camera component - positioned at the left corner of page */}
          <div className="fixed top-0 right-2">
            <div className="bg-black/70 rounded-lg overflow-hidden shadow-xl" style={{ width: '180px', height: '135px' }}>
              <CameraProctor
                detectionEnabled={false} // Disable detection on completion page
              />
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="max-w-md w-full card-dark p-8 animate-fadeIn mt-16">
              <div className="flex items-center justify-center text-orange-500 mb-6">
                <div className="bg-orange-900/30 p-3 rounded-full">
                  <CheckIcon className="h-12 w-12" />
                </div>
              </div>
              
              {/* Animated Training Assessment Text */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <img src={sharedImage} alt="Assessment Logo" className="h-7" />
                  </div>
                  <h1 className="text-3xl font-bold animate-pulse-slow">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-white">
                      Assessment Completed
                    </span>
                  </h1>
                </div>
              </div>
              
              <p className="text-center text-gray-300 mb-6">
                Thank you for completing the MCQ portion. Your responses have been recorded.
              </p>
              <div className="bg-blue-900/30 border-l-4 border-blue-500 p-4 mb-6 rounded-r-md">
                <div className="flex">
                  <InfoIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-300">
                      Please wait while we prepare your voice interview. You will be redirected automatically.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render interview instructions or waiting state
  if (phase === 'instructions' || phase === 'waiting') {
    return (
      <div className="min-h-screen bg-neutrino-gradient text-white">
        {/* Navbar with Neutrino logo and camera */}
        <nav className="w-full bg-black/30 shadow-md z-50 py-2">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between px-4 relative">
              {/* Logo positioned at absolute top-left */}
              <div className="absolute top-0 left-0 z-50 p-2">
                <img src={sharedImage} alt="Neutrino Logo" className="h-10" />
              </div>
              
              {/* Centered title */}
              <div className="mx-auto">
                <h1 className="text-2xl font-bold whitespace-nowrap animate-pulse-slow">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-white">
                    Technical Assessment
                  </span>
                </h1>
              </div>
              
              {/* Camera component on the right side of navbar */}
              <div className="absolute top-1 right-2" style={{ width: '180px', height: '135px' }}>
                <div className="bg-black/70 rounded-lg overflow-hidden shadow-xl w-full h-full">
                  <CameraProctor
                    detectionEnabled={phase === 'mcq'} // Only enable detection during MCQ phase
                  />
                </div>
              </div>
            </div>
          </div>
        </nav>
        <div className="pt-14 pb-1 px-4 sm:px-6 lg:px-8">
          
          <div className="flex max-w-6xl mx-auto gap-2">
            {/* Interview Details on the left - decreased width */}
            <div className="w-1/3">
              <div className="card-dark p-1.5 h-full">
                <h3 className="text-xs font-semibold text-gray-200 mb-0.5 flex items-center">
                  <AssignmentIcon className="mr-1.5 text-orange-400 text-xs" />
                  Interview Details
                </h3>
                <div className="bg-gray-800/50 rounded-lg p-1.5 border border-gray-700">
                  <div className="space-y-0.5">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Position</p>
                      <p className="text-sm text-gray-200 font-semibold">{interview.job_role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Scheduled Time</p>
                      <p className="text-sm text-gray-200">{formatDate(interview.scheduled_datetime)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Interview ID</p>
                      <p className="text-gray-200 font-mono text-xs">{interview.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Candidate</p>
                      <p className="text-sm text-gray-200 font-semibold">{interview.candidate_name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main form on the right - increased width */}
            <div className="w-2/3">
              <div className="card-dark p-1">
              {/* Header */}
              <div className="flex justify-between items-center mb-1">
                <div className="text-base font-bold text-white">
                  {/* Removed "Instructions" text as requested */}
                </div>
                {timerActive && (
                  <div className="bg-black/30 rounded-lg px-3 py-1 flex items-center text-white">
                    <TimerIcon className="mr-1 h-5 w-5" />
                    <span className="font-mono">{formatTime(instructionTimer)}</span>
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="space-y-1">
                
                {/* Instructions */}
                <div>
                  <h3 className="text-base font-semibold text-gray-200 mb-1 flex items-center">
                    <QuestionIcon className="mr-2 text-orange-400 text-sm" />
                    MCQ Assessment Instructions
                  </h3>
                  <div className="space-y-1 text-gray-300 bg-gray-800/50 p-1.5 rounded-lg border border-gray-700">
                    <p className="flex items-start">
                      <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 text-xs">1</span>
                      <span className="text-sm">This assessment consists of multiple-choice questions based on your resume and the job description.</span>
                    </p>
                    <p className="flex items-start">
                      <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 text-xs">2</span>
                      <span className="text-sm">The questions are designed to assess your skills and experience relevant to the position.</span>
                    </p>
                    <p className="flex items-start">
                      <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 text-xs">3</span>
                      <span className="text-sm">You will see one question at a time and can only move forward after selecting an answer.</span>
                    </p>
                    <p className="flex items-start">
                      <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 text-xs">4</span>
                      <span className="text-sm">Once you move to the next question, you cannot go back to change your answer.</span>
                    </p>
                    <p className="flex items-start">
                      <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 text-xs">5</span>
                      <span className="text-sm">There is no time limit for individual questions, but try to complete the assessment in one sitting.</span>
                    </p>
                  </div>
                </div>
                
                {/* Info box */}
                <div className="bg-blue-900/30 border-l-4 border-blue-500 p-1.5 rounded-r-md">
                  <div className="flex items-center">
                    <InfoIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <div className="ml-2">
                      <p className="text-xs text-blue-300 leading-tight">
                        Make sure you're in a quiet environment with a stable internet connection before starting the assessment.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Start button */}
                <div className="flex justify-center pt-1">
                  <button
                    onClick={() => {
                      // Start camera when the assessment begins
                      // Camera is already started by the context
                      handleStartInstructions();
                    }}
                    disabled={timerActive || generatingMcqs || phase === 'waiting'}
                    className="px-6 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                  >
                    {timerActive ? (
                      <span className="flex items-center text-sm">
                        <TimerIcon className="mr-2 h-4 w-4" />
                        Reading Time: {formatTime(instructionTimer)}
                      </span>
                    ) : phase === 'waiting' ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                        Preparing Questions...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <PlayIcon className="mr-2" />
                        <VideocamIcon className="mr-1" />
                        Begin Assessment
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    );
  }

  // Render MCQ questions
  const currentQuestion = getCurrentQuestion();
  
  return (
    <div className="min-h-screen bg-neutrino-gradient text-white">
      {/* Header with Neutrino branding and timer */}
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center py-4 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img src={sharedImage} alt="Assessment Logo" className="h-8" />
              </div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <SchoolIcon className="mr-2" />
                {interview.job_role} Assessment
              </h2>
            </div>
            <div className="flex items-center">
              <div className="mr-4 text-right">
                <div className="text-sm text-gray-300">Time Left</div>
                <div className="text-lg font-medium text-white">{formatTime(mcqTimer)}</div>
              </div>
              <button className="text-white p-2 rounded-full hover:bg-white/10">
                <MenuIcon />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="py-3 px-3 sm:px-4 lg:px-6">
        <div className="flex max-w-5xl mx-auto relative">
          {/* Main content area - 75% width */}
          <div className="w-3/4 pr-2">
            {/* Camera component - positioned at the right corner with smaller size */}
            {isActive && (
              <div className="fixed top-24 right-2 z-50" style={{ width: '180px', height: '135px' }}>
                <div className="bg-black/70 rounded-lg overflow-hidden shadow-xl w-full h-full">
                  <CameraProctor
                    detectionEnabled={true} // Enable detection during MCQ phase
                  />
                </div>
              </div>
            )}
            
            <div className="card-dark p-2">
              {/* Compact timer display */}
              <div className="flex justify-between items-center mb-3 bg-gray-800/50 p-2 rounded-lg">
                <div className="text-sm font-bold text-white">
                  Time Left
                </div>
                <div className="text-lg font-bold text-white">
                  {formatTime(mcqTimer)}
                </div>
              </div>
              
              {/* Question header */}
              <div className="border-b border-gray-700 pb-1 mb-2">
                <h3 className="text-base font-bold text-white">
                  Question {currentQuestionIndex + 1}
                </h3>
              </div>
            
              {/* Question content */}
              <div className="space-y-2">
                <div className="bg-gray-800/50 rounded-lg p-1.5 border border-gray-700 mb-2">
                  <p className="text-sm font-medium text-gray-200 px-0.5">
                    {currentQuestion?.question}
                  </p>
                </div>
                
                <div className="space-y-2">
                  {currentQuestion?.options.map((option, index) => {
                    const optionLetters = ['A', 'B', 'C', 'D', 'E'];
                    return (
                      <button
                        key={index}
                        onClick={() => handleSelectAnswer(option)}
                        type="button"
                        className={`flex items-start w-full text-left py-1 px-1.5 rounded-lg border transition-all duration-200 ${
                          isOptionSelected(option)
                            ? 'border-orange-500 bg-orange-900/20 shadow-md'
                            : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-5 h-5 rounded-md border-2 mr-2 flex items-center justify-center ${
                          isOptionSelected(option)
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-gray-500'
                        }`}>
                          {isOptionSelected(option) && (
                            <CheckIcon className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-200 font-medium">
                            <span className="font-bold mr-2">{optionLetters[index]}.</span>
                            {option}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Next button */}
              <div className="flex justify-end pt-2 border-t border-gray-700 mt-2">
                <button
                  onClick={handleNextQuestion}
                  disabled={!answers[currentQuestionIndex]}
                  className={`px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center ${
                    !answers[currentQuestionIndex] ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {currentQuestionIndex < mcqs.length - 1 ? (
                    <span className="flex items-center">
                      Next Question
                      <NextIcon className="ml-2" />
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Complete Assessment
                      <CheckIcon className="ml-2" />
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Question navigation panel - 25% width */}
          <div className="w-1/4 pl-2">
            <div className="card-dark bg-gray-800/80 sticky top-24 p-2">
              <h3 className="text-sm font-bold text-white mb-2">
                Progress
              </h3>
              
              <div className="grid grid-cols-4 gap-1 mb-2">
                {mcqs.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`h-6 w-6 flex items-center justify-center rounded-md font-medium text-xs transition-colors ${
                      currentQuestionIndex === index
                        ? 'bg-orange-500 text-white'
                        : answers[index] !== undefined
                          ? 'bg-green-600/30 text-white border border-green-500'
                          : 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-sm mr-1"></div>
                  <span className="text-gray-300 text-xs">Now</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-600/30 border border-green-500 rounded-sm mr-1"></div>
                  <span className="text-gray-300 text-xs">Done</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-gray-700/50 border border-gray-600 rounded-sm mr-1"></div>
                  <span className="text-gray-300 text-xs">Todo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidateInterview;
