import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import interviewService from '../services/interviewService';

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
  Warning as WarningIcon
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

  /**
   * Start the interview by generating MCQs
   */
  const handleStartInterview = async () => {
    if (!interview) {
      logger.warn('Attempted to start interview but interview data is not loaded');
      return;
    }

    logger.info('Starting interview process', {
      interviewId,
      candidateName: interview.candidate_name,
      candidateEmail: interview.candidate_email
    });
    
    setGeneratingMcqs(true);
    setError(null);

    try {
      // Generate MCQs based on resume and job description
      logger.info('Generating MCQs for interview', { interviewId });
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
      
      // Start the interview
      logger.info('Starting the interview with generated MCQs');
      setStarted(true);
      setCurrentQuestionIndex(0);
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
  const handleNextQuestion = () => {
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

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-center text-red-500 mb-4">
            <WarningIcon className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Error Loading Interview
          </h1>
          <p className="text-center text-gray-700 dark:text-gray-300 mb-6">
            {error}
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render interview not found state
  if (!interview) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-center text-yellow-500 mb-4">
            <WarningIcon className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Interview Not Found
          </h1>
          <p className="text-center text-gray-700 dark:text-gray-300 mb-6">
            The interview you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  // Render completed state
  if (completed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-center text-green-500 mb-4">
            <CheckIcon className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Interview Completed
          </h1>
          <p className="text-center text-gray-700 dark:text-gray-300 mb-6">
            Thank you for completing the interview. Your responses have been recorded.
          </p>
          <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4 mb-6">
            <div className="flex">
              <InfoIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-700 dark:text-green-400">
                  You will be contacted with the results of your interview soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render interview instructions (not started)
  if (!started) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
            Welcome to Your Interview
          </h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Interview Details
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Candidate</p>
                  <p className="text-gray-900 dark:text-white">{interview.candidate_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Position</p>
                  <p className="text-gray-900 dark:text-white">{interview.job_role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Scheduled Time</p>
                  <p className="text-gray-900 dark:text-white">{formatDate(interview.scheduled_datetime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Interview ID</p>
                  <p className="text-gray-900 dark:text-white font-mono">{interview.id}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Instructions
            </h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p>1. This interview consists of multiple-choice questions based on your resume and the job description.</p>
              <p>2. The questions are designed to assess your skills and experience relevant to the position.</p>
              <p>3. You will see one question at a time and can only move forward after selecting an answer.</p>
              <p>4. Once you move to the next question, you cannot go back to change your answer.</p>
              <p>5. There is no time limit, but try to complete the interview in one sitting.</p>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex">
              <InfoIcon className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Make sure you're in a quiet environment with a stable internet connection before starting the interview.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={handleStartInterview}
              disabled={generatingMcqs}
              className="btn btn-primary"
            >
              {generatingMcqs ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Preparing Questions...
                </span>
              ) : (
                <span className="flex items-center">
                  <PlayIcon className="h-5 w-5 mr-1" />
                  Start Interview
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render MCQ questions
  const currentQuestion = getCurrentQuestion();
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {interview.job_role} Interview
          </h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Question {currentQuestionIndex + 1} of {mcqs.length}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 mb-4">
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {currentQuestion?.question}
            </p>
          </div>
          
          <div className="space-y-3">
            {currentQuestion?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelectAnswer(option)}
                className={`w-full text-left p-3 rounded-md border ${
                  isOptionSelected(option)
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <p className="text-gray-900 dark:text-white">{option}</p>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleNextQuestion}
            disabled={!answers[currentQuestionIndex]}
            className="btn btn-primary"
          >
            {currentQuestionIndex < mcqs.length - 1 ? (
              <span className="flex items-center">
                Next Question
                <NextIcon className="h-5 w-5 ml-1" />
              </span>
            ) : (
              <span className="flex items-center">
                Complete Interview
                <CheckIcon className="h-5 w-5 ml-1" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CandidateInterview;