import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import interviewService from '../services/interviewService';
import CameraProctor from '../components/CameraProctor';
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
  Videocam as VideocamIcon
} from '@mui/icons-material';

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
  const [started, setStarted] = useState(false);
  const [mcqs, setMcqs] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);
  const [generatingMcqs, setGeneratingMcqs] = useState(false);
  const [instructionTimer, setInstructionTimer] = useState(60); // 1 minute in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [mcqsGenerated, setMcqsGenerated] = useState(false);
  const timerRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('inactive');

  // Fetch interview details on component mount
  useEffect(() => {
    const fetchInterview = async () => {
      logger.info(`Fetching interview with ID: ${interviewId}`);
      try {
        setLoading(true);
        const data = await interviewService.getCandidateInterview(interviewId);
        logger.info('Interview data retrieved successfully', data);
        setInterview(data);
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
        setStarted(true);
      }
      setTimerActive(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timerActive, instructionTimer, mcqsGenerated]);

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
          logger.info('MCQs completed, redirecting to voice interview');
          // Redirect to voice interview page
          navigate(`/voice-interview/${interviewId}`);
        }
      } catch (err) {
        logger.error('Error checking interview status', err);
      }
    };
    
    checkInterviewStatus();
  }, [completed, interviewId, navigate, interview]);

  /**
   * Start the instruction timer and begin MCQ generation in the background
   */
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
    
    // Start MCQ generation in the background
    generateMcqsInBackground();
    
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
      if (instructionTimer === 0) {
        logger.info('Timer already finished, starting the interview with generated MCQs');
        setStarted(true);
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
    // This is a simple parser for the MCQ format
    // In a real application, you would want a more robust parser
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
            options: currentOptions,
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
        correctAnswer = trimmedLine.replace(/^answer:\s*/i, '').trim();
      }
    }
    
    // Add the last question
    if (currentQuestion && currentOptions.length > 0) {
      questions.push({
        question: currentQuestion,
        options: currentOptions,
        correctAnswer: correctAnswer
      });
    }
    
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
      
      // Stop camera when interview is completed
      setCameraActive(false);
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
  if (completed) {
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
        <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8 animate-fadeIn">
          <div className="flex items-center justify-center text-green-500 mb-6">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckIcon className="h-12 w-12" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
            MCQ Assessment Completed
          </h1>
          <p className="text-center text-gray-700 mb-6">
            Thank you for completing the MCQ portion. Your responses have been recorded.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-md">
            <div className="flex">
              <InfoIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Please wait while we prepare your voice interview. You will be redirected automatically.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Render interview instructions (not started)
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Camera component - positioned at the right middle side */}
          {cameraActive && (
            <div className="absolute right-7 bottom-0 transform -translate-y-1/2 mr-[-7px]">
              <CameraProctor
                active={cameraActive}
                onStatusChange={setCameraStatus}
              />
            </div>
          )}
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white flex items-center">
                  <SchoolIcon className="mr-2" />
                  Technical Assessment
                </h1>
                {timerActive && (
                  <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 flex items-center text-white">
                    <TimerIcon className="mr-1 h-5 w-5" />
                    <span className="font-mono">{formatTime(instructionTimer)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {/* Interview Details */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <AssignmentIcon className="mr-2 text-primary-600" />
                  Interview Details
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Candidate</p>
                      <p className="text-gray-900 font-semibold">{interview.candidate_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Position</p>
                      <p className="text-gray-900 font-semibold">{interview.job_role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Scheduled Time</p>
                      <p className="text-gray-900">{formatDate(interview.scheduled_datetime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Interview ID</p>
                      <p className="text-gray-900 font-mono text-sm">{interview.id}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <QuestionIcon className="mr-2 text-primary-600" />
                  MCQ Assessment Instructions
                </h2>
                <div className="space-y-3 text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="flex items-start">
                    <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">1</span>
                    <span>This assessment consists of multiple-choice questions based on your resume and the job description.</span>
                  </p>
                  <p className="flex items-start">
                    <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">2</span>
                    <span>The questions are designed to assess your skills and experience relevant to the position.</span>
                  </p>
                  <p className="flex items-start">
                    <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">3</span>
                    <span>You will see one question at a time and can only move forward after selecting an answer.</span>
                  </p>
                  <p className="flex items-start">
                    <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">4</span>
                    <span>Once you move to the next question, you cannot go back to change your answer.</span>
                  </p>
                  <p className="flex items-start">
                    <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">5</span>
                    <span>There is no time limit for individual questions, but try to complete the assessment in one sitting.</span>
                  </p>
                </div>
              </div>
              
              {/* Info box */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-md">
                <div className="flex">
                  <InfoIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Make sure you're in a quiet environment with a stable internet connection before starting the assessment.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Start button */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    // Start camera when the assessment begins
                    setCameraActive(true);
                    handleStartInstructions();
                  }}
                  disabled={timerActive || generatingMcqs}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                >
                  {timerActive ? (
                    <span className="flex items-center">
                      <TimerIcon className="mr-2" />
                      Reading Time: {formatTime(instructionTimer)}
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
    );
  }

  // Render MCQ questions
  const currentQuestion = getCurrentQuestion();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto relative">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-white flex items-center">
                <SchoolIcon className="mr-2" />
                {interview.job_role} Assessment
              </h1>
              <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 text-white">
                <span className="font-medium">Question {currentQuestionIndex + 1}/{mcqs.length}</span>
              </div>
            </div>
          </div>
          
          {/* Question content */}
          <div className="p-6">
            {/* Camera component - positioned at the right middle side */}
            <div className="absolute right-7 top-1/2 transform -translate-y-1/2 mr-[-260px]">
              <CameraProctor
                active={cameraActive}
                onStatusChange={setCameraStatus}
              />
            </div>
            <div className="mb-8">
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 mb-6">
                <p className="text-lg font-medium text-gray-900">
                  {currentQuestion?.question}
                </p>
              </div>
              
              <div className="space-y-3">
                {currentQuestion?.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      isOptionSelected(option)
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-gray-900 font-medium">{option}</p>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleNextQuestion}
                disabled={!answers[currentQuestionIndex]}
                className={`px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center ${
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
      </div>
    </div>
  );
}

export default CandidateInterview;
