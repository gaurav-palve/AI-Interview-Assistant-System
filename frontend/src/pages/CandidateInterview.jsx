import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import interviewService from '../services/interviewService';
import CameraProctorNew from '../components/CameraProctorNew';

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
  Menu as MenuIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Home as HomeIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ScanFace } from "lucide-react";
import completedTick from "../assets/completed-tick.gif";


/**
 * CandidateInterview page component
 * Displays interview instructions and MCQs for candidates
 */
function CandidateInterview() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState('instructions'); // 'instructions', 'waiting', 'mcq', 'completed'
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [mcqs, setMcqs] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);
  const [generatingMcqs, setGeneratingMcqs] = useState(false);
  const [instructionTimer, setInstructionTimer] = useState(20); // 20 seconds in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [mcqsGenerated, setMcqsGenerated] = useState(false);
  const [mcqTimer, setMcqTimer] = useState(300); // 5 minutes in seconds for the MCQ test
  const [mcqTimerActive, setMcqTimerActive] = useState(false);
  const timerRef = useRef(null);
  const mcqTimerRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraPermissionRequested, setCameraPermissionRequested] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [mcqTimeTaken, setMcqTimeTaken] = useState(0);
  const isGeneratingRef = useRef(false);

  // Permission states
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState('');

  const [cameraKey, setCameraKey] = useState(0);

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

    logger.warn(`Cheating detected: ${type}`, message);
  }, [toast]);

  // MCQ Timer effect
  useEffect(() => {
    if (mcqTimerActive && mcqTimer > 0) {
      mcqTimerRef.current = setTimeout(() => {
        setMcqTimer(mcqTimer - 1);
      }, 1000);
    } else if (mcqTimerActive && mcqTimer === 0) {
      // Timer expired, auto-submit the assessment
      logger.info('MCQ timer expired, auto-submitting assessment');
      setMcqTimerActive(false);

      // Auto-submit with current answers
      handleAutoSubmit();
    }

    return () => {
      if (mcqTimerRef.current) {
        clearTimeout(mcqTimerRef.current);
      }
    };
  }, [mcqTimerActive, mcqTimer]);


  // Request permissions on component mount
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
      // Automatically request permissions when the candidate lands on the page
      requestPermissions();
    }
  }, [interviewId]);

  /**
   * Request camera and microphone permissions
   */
  const requestPermissions = async () => {
    setPermissionsLoading(true);
    setPermissionsError('');

    try {
      logger.info('Requesting camera permission');

      // Request camera permission
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission(true);
      cameraStream.getTracks().forEach(track => track.stop());
      logger.info('Camera permission granted');

      logger.info('Requesting microphone permission');

      // Request microphone permission
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophonePermission(true);
      audioStream.getTracks().forEach(track => track.stop());
      logger.info('Microphone permission granted');

      setPermissionsGranted(true);
      setCameraReady(true);
      setPhase('instructions');

      // Start generating MCQs in background
      generateMcqsInBackground();
      return true;
    } catch (err) {
      logger.error('Permission request failed', err);

      const isBlocked = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const errorMessage = isBlocked
        ? 'Permissions are blocked. Please click the Lock Icon in your browser address bar and set Camera/Microphone to "Allow", then click Begin Assessment again.'
        : 'Camera and/or Microphone permissions are required. Please allow access and try again.';

      if (isBlocked) {
        setShowPermissionGuide(true);
      }

      setPermissionsError(errorMessage);
      toast({
        title: isBlocked ? 'Permissions Blocked' : 'Permission Denied',
        description: errorMessage,
        status: 'error',
        duration: 8000,
        isClosable: true,
        position: 'top-right'
      });
      return false;
    } finally {
      setPermissionsLoading(false);
    }
  };

  /**
   * Handle retry permissions
   */
  const handleRetryPermissions = () => {
    setPermissionsError('');
    setPermissionsGranted(false);
    setCameraPermission(false);
    setMicrophonePermission(false);
    requestPermissions();
  };

  // Timer effect for instruction reading
  useEffect(() => {
    if (timerActive && instructionTimer > 0) {
      timerRef.current = setTimeout(() => {
        setInstructionTimer(instructionTimer - 1);
      }, 1000);
    } else if (timerActive && instructionTimer === 0) {
      // Timer finished, show MCQs if they're generated
      if (mcqsGenerated) {
        logger.info('Timer finished and MCQs are ready, starting MCQ phase');
        setPhase('mcq');
        setMcqTimerActive(true);
      } else {
        logger.info('Timer finished but MCQs are not ready yet, entering waiting phase');
        setPhase('waiting');
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

  // Fetch existing MCQs or check if they are ready
  const fetchMCQsStatus = useCallback(async (id) => {
    try {
      logger.info('Checking MCQ status...', { interviewId: id });
      const response = await interviewService.getCandidateMCQs(id);

      if (response && response.length > 0) {
        logger.info('MCQs fetched successfully', { responseLength: response.length });
        const parsedMcqs = parseMcqs(response);
        setMcqs(parsedMcqs);
        setMcqsGenerated(true);

        if (phase === 'waiting') {
          setPhase('mcq');
          setMcqTimerActive(true);
        }
        return true;
      }
      return false;
    } catch (err) {
      // Handle the case where MCQs are not found yet (expected 404)
      // interviewService handles the response and throws error.response?.data
      // If we want the status, we might need to check if the error object from axios was passed down
      // or check the detail message.
      if (err.status === 404 || (err.detail && err.detail.toLowerCase().includes('not found'))) {
        logger.info('MCQs not found yet (still generating or not started)');
      } else {
        logger.error('Error fetching MCQ status', err);
      }
      return false;
    }
  }, [phase]);

  // Trigger MCQ generation (should only be called if we know they don't exist)
  const triggerMCQGeneration = useCallback(async (id) => {
    if (isGeneratingRef.current) return;

    try {
      isGeneratingRef.current = true;
      setGeneratingMcqs(true);
      logger.info('Triggering MCQ generation', { interviewId: id });
      await interviewService.generateCandidateMCQs(id);
      logger.info('Generation request completed successfully');
    } catch (err) {
      logger.error('Error triggering MCQ generation', err);
    } finally {
      // We keep isGeneratingRef true for a bit to avoid immediate re-triggers if pollin happens
      setTimeout(() => {
        isGeneratingRef.current = false;
        setGeneratingMcqs(false);
      }, 5000);
    }
  }, []);

  // Combined function used by Background generation and Poll
  const handleMCQFlow = useCallback(
    async (id) => {
      // 1. Try to fetch first
      const ready = await fetchMCQsStatus(id);

      // 2. If not ready and not already generating, trigger it
      if (!ready && !isGeneratingRef.current) {
        await triggerMCQGeneration(id);
      }
    },
    [fetchMCQsStatus, triggerMCQGeneration]
  );

  const debouncedMCQCheck = useCallback(
    debounce((id) => handleMCQFlow(id), 500),
    [handleMCQFlow]
  );

  // Effect to poll for MCQ status when in waiting phase
  useEffect(() => {
    let pollInterval = null;
    let pollCount = 0;
    const maxPolls = 20;

    const startPolling = async () => {
      if (phase === 'waiting' && !mcqsGenerated) {
        logger.info('Starting polling for MCQ status');

        // Check immediately and ONLY start interval if it fails
        const alreadyReady = await fetchMCQsStatus(interviewId);

        if (alreadyReady) return;

        pollInterval = setInterval(async () => {
          pollCount++;
          logger.info(`Polling for MCQs (attempt ${pollCount}/${maxPolls})`);

          if (pollCount >= maxPolls) {
            logger.warn(`Reached maximum polling attempts (${maxPolls})`);
            clearInterval(pollInterval);
            return;
          }

          const ready = await fetchMCQsStatus(interviewId);
          if (ready) {
            clearInterval(pollInterval);
          }
        }, 5000);
      }
    };

    startPolling();

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [phase, mcqsGenerated, interviewId, fetchMCQsStatus]);

  // Effect to check interview status and redirect to voice interview if needed
  useEffect(() => {
    const checkInterviewStatus = async () => {
      // Don't redirect if already in completed phase
      if (!completed || !interview || phase === 'completed') return;

      try {
        const data = await interviewService.getCandidateInterview(interviewId);
        logger.info('Checking interview status after MCQ completion', data);

        if (data.status === "mcq_completed") {
          logger.info('MCQs completed, transition to internal completion phase');
          setPhase('completed');
        }
      } catch (err) {
        logger.error('Error checking interview status', err);
      }
    };
    checkInterviewStatus();
  }, [completed, interviewId, navigate, interview, phase]);

  /**
   * Generate MCQs in the background while the candidate reads instructions
   */
  const generateMcqsInBackground = () => {
    setError(null);
    debouncedMCQCheck(interviewId);
  };

  /**
   * Start the test immediately and transition the phase
   */
  const handleStartInstructions = async () => {
    if (!interview) {
      logger.warn('Attempted to start interview but interview data is not loaded');
      return;
    }

    // Check if camera and microphone permissions are granted
    if (!permissionsGranted) {
      logger.info('Permissions not granted, requesting permissions again before starting');

      const granted = await requestPermissions();
      if (!granted) return; // User denied or closed the prompt
    }

    logger.info('Starting Assessment transition', {
      interviewId,
      mcqsReady: mcqsGenerated
    });

    if (mcqsGenerated) {
      setPhase('mcq');
      setMcqTimerActive(true);
    } else {
      setPhase('waiting');
      generateMcqsInBackground();
    }
  };

  /**
   * Parse MCQs from the response text
   */
  const parseMcqs = (mcqText) => {
    logger.debug('Parsing MCQ text', { textLength: mcqText.length });
    const questions = [];
    const lines = mcqText.split('\n');

    let currentQuestion = null;
    let currentOptions = [];
    let correctAnswer = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!trimmedLine) continue;

      if (/^\d+\./.test(trimmedLine)) {
        if (currentQuestion && currentOptions.length > 0) {
          questions.push({
            question: currentQuestion,
            options: currentOptions.map(opt => opt.replace(/^[a-d][\)\.]\s*/i, '')),
            correctAnswer: correctAnswer
          });
        }

        currentQuestion = trimmedLine;
        currentOptions = [];
        correctAnswer = null;
      }
      else if (/^[a-d][\)\.]/.test(trimmedLine.toLowerCase())) {
        currentOptions.push(trimmedLine);
      }
      else if (/^answer:/i.test(trimmedLine)) {
        const answerMatch = trimmedLine.match(/^answer:\s*[a-d][\)\.]\s*(.*)/i);
        if (answerMatch && answerMatch[1]) {
          correctAnswer = answerMatch[1].trim();
        } else {
          correctAnswer = trimmedLine.replace(/^answer:\s*/i, '').trim();
        }
      }
    }

    if (currentQuestion && currentOptions.length > 0) {
      questions.push({
        question: currentQuestion,
        options: currentOptions.map(opt => opt.replace(/^[a-d][\)\.]\s*/i, '')),
        correctAnswer: correctAnswer
      });
    }

    logger.debug('Parsed MCQs', {
      count: questions.length,
      firstQuestion: questions[0]?.question,
      firstOptions: questions[0]?.options
    });

    return questions;
  };

  /**
   * Handle answer selection
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
   * Move to the next question or show submission confirmation
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
      setIsSubmitModalOpen(true);
    }
  };

  /**
   * Final submission of MCQ answers
   */
  const handleSubmitMcqs = async () => {
    logger.info('Submitting MCQ assessment', {
      totalQuestions: mcqs.length,
      answersCollected: Object.keys(answers).length
    });

    setIsSubmitModalOpen(false);

    try {
      const responses = mcqs.map((mcq, index) => {
        const selectedAnswer = answers[index] || '';
        return {
          question: mcq.question,
          question_id: index + 1,
          selected_answer: selectedAnswer,
          correct_answer: mcq.correctAnswer || '',
          is_correct: selectedAnswer === mcq.correctAnswer
        };
      });

      const correctAnswers = responses.filter(r => r.is_correct).length;
      const totalScore = correctAnswers;
      const maxScore = mcqs.length;

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
    }

    // Calculate time taken: Total (300) - Remaining (mcqTimer)
    const totalTime = 300;
    setMcqTimeTaken(totalTime - mcqTimer);

    setPhase('completed');
    setCompleted(true);
  };

  /**
   * Auto-submit the assessment when timer expires
   */
  const handleAutoSubmit = async () => {
    logger.info('Auto-submitting assessment due to timer expiry');
    await handleSubmitMcqs();
  };

  /**
   * Get the current question
   */
  const getCurrentQuestion = () => {
    if (!mcqs.length || currentQuestionIndex >= mcqs.length) return null;
    return mcqs[currentQuestionIndex];
  };

  /**
   * Check if an option is selected
   */
  const isOptionSelected = (option) => {
    return answers[currentQuestionIndex] === option;
  };

  /**
   * Format the scheduled date for display
   */
  const formatDate = (dateString, timezone = 'UTC') => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch (error) {
      console.error('Error formatting date with timezone:', error);
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    }
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


  // Render interview instructions or waiting state
  // Determine active step for sidebar
  const getActiveStep = () => {
    if (phase === 'instructions' || phase === 'waiting') return 'details';
    if (phase === 'mcq') return 'assessment';
    if (phase === 'completed') return 'assessment'; // Or maybe 'voice' if it's the next one, but for now assessment is done
    return 'details';
  };

  const activeStep = getActiveStep();

  return (
    <div className="h-screen bg-[#050D27] flex font-sans text-white overflow-hidden">
      {/* Sticky Sidebar (Dark RecruitIQ pattern) */}
      <div className="w-52 bg-[#081433] h-full flex flex-col pt-8 border-r border-white/5 flex-shrink-0 relative overflow-y-auto">
        <div className="px-6 mb-12 flex items-center gap-2">
          <span className="text-white font-bold text-lg tracking-tight">RecruitIQ</span>
          {/* <div className="flex gap-0.5 ml-1 opacity-60">
            <div className="w-1.5 h-1.5 border-t border-r border-white rotate-45" />
            <div className="w-1.5 h-1.5 border-t border-r border-white rotate-45 -ml-1" />
          </div> */}
        </div>

        <nav className="flex-1 space-y-0.5 px-4">
          <div className={`py-2 px-4 rounded-md flex items-center gap-3 transition-all cursor-pointer ${activeStep === 'details' ? 'bg-[#0E1E4C] border-l-2 border-white text-white shadow-sm' : 'text-white'}`}>
            <HomeIcon sx={{ fontSize: 16 }} />
            <span className="text-[12px] font-medium">Dashboard</span>
          </div>

          <div className={`py-2 px-4 rounded-md flex items-center gap-3 transition-all cursor-pointer ${activeStep === 'assessment' ? 'bg-[#0E1E4C] border-l-2 border-white text-white shadow-sm' : 'text-white hover:text-white'}`}>
            <QuestionIcon sx={{ fontSize: 16 }} />
            <span className="text-[12px] font-medium">Technical Assessment</span>
          </div>

          <div className="py-2 px-4 rounded-md flex items-center gap-3 text-white cursor-not-allowed">
            <MicIcon sx={{ fontSize: 16 }} />
            <span className="text-[12px] font-medium">Voice Interview</span>
          </div>

          <div className="py-2 px-4 rounded-md flex items-center gap-3 text-white cursor-not-allowed">
            <SchoolIcon sx={{ fontSize: 16 }} />
            <span className="text-[12px] font-medium">Coding Round</span>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header - Restricted to assessment related phases */}
        {(phase === 'instructions' || phase === 'waiting' || phase === 'mcq' || phase === 'completed') && (
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
        )}

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto">
          {(phase === 'instructions' || phase === 'waiting') && (
            <main className="p-4 max-w-4xl mx-auto w-full animate-fadeIn transition-all duration-700">
              {/* Header Section */}
              <div className="flex justify-between items-center mb-0.5">
                <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-4">
                  The Interviewee Details
                  <span className="bg-[#052E16] text-emerald-500 text-[10px] font-medium px-2 py-[2px] leading-none rounded-sm border border-[#14532D] flex items-center gap-1 shadow-sm h-5">
                    <div className="w-1 h-1 bg-[#4ADE80] rounded-full animate-pulse" />
                    Session is ready to launch ↗
                  </span>
                </h1>
              </div>

              <p className="text-white text-[11px] font-medium mb-3">
                Review your session before beginning the assessment
              </p>

              {/* Schedule Info */}
              <div className="bg-[#0B1739] border border-[#1E293B] rounded-md px-3.5 py-1.5 inline-flex items-center gap-2.5 mb-5 shadow-sm backdrop-blur-sm">
                <span className="text-white text-[11px] font-normal font-['Inter'] tracking-wide">Schedule Time:</span>
                <span className="text-white text-[11px] font-semibold font-['Inter'] tracking-wide">
                  {interview ? formatDate(interview.scheduled_datetime, interview.timezone) : '13 Feb 2025, 10:15 AM GMT+5:30'}
                </span>
              </div>

              {/* Step Indicator */}
              <div className="flex items-center justify-between w-full mb-6 relative px-0">
                {/* Connecting Lines */}
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#1E293B] -translate-y-1/2 z-0" />

                {[
                  { num: 1, label: 'Details', active: true },
                  { num: 2, label: 'Technical', active: false },
                  { num: 3, label: 'Voice', active: false },
                  { num: 4, label: 'Coding', active: false }
                ].map((step, idx) => (
                  <div key={idx} className={`flex items-center gap-2 z-10 bg-[#050D27] ${idx === 0 ? 'pr-2' : idx === 3 ? 'pl-2' : 'px-2'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] shadow-lg transition-all transform hover:scale-105 ${step.active ? 'bg-[#2563EB] text-white ring-1 ring-white' : 'bg-[#1E293B] text-gray-400 ring-1 ring-[#343B4F]'
                      }`}>
                      {step.num}
                    </div>
                    <span className={`text-[10px] font-bold tracking-tight ${step.active ? 'text-white' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Detail Cards */}
              <div className="grid grid-cols-3 gap-3.5 mb-4">
                {[
                  { label: 'Position', value: interview?.job_role || 'Software Engineer' },
                  { label: 'Candidate', value: interview?.candidate_name || 'Sumeet Bhosale' },
                  { label: 'Interview ID', value: interview?.id || '6ang239893g' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#0B1739] border border-[#1E293B] rounded-md p-3 transition-all hover:border-[#2563EB]/40 hover:bg-[#0F172A]/50 group">
                    <label className="text-white text-[9px] font-normal uppercase tracking-widest mb-0.5 block group-hover:text-[#2563EB]/80 transition-colors">
                      {item.label}
                    </label>
                    <p className="text-sm font-bold text-white tracking-tight">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Instruction Box */}
              <div className="bg-[#0B1739] border border-[#1E293B] rounded-md p-4 mb-4 backdrop-blur-sm relative group hover:border-[#2563EB]/30 transition-all h-32 flex flex-col ">
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-[#2563EB]/20 scrollbar-track-[#0B1739]">
                  <div className="absolute top-0 left-0 w-0 h-full bg-[#0B1739] group-hover:bg-[#2563EB]/40 transition-all" />
                  <h3 className="text-base font-bold text-white mb-3 tracking-tight">MCQ Assessment Instructions</h3>
                  <ul className="space-y-1.5">
                    {[
                      "The mathematical questions include boats & streams, finding next number in a sequence, time & distance, and probability.",
                      "This assessment consists of 10 multiple-choice questions: 5 mathematical aptitude and 5 technical core concepts.",
                      "You will see one question at a time and can only move forward after selecting an answer.",
                      "Once you move to the next question, you cannot go back to change your answer.",
                      "The assessment will be automatically submitted when the 5-minute timer expires."
                    ].map((text, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-gray-300 group/item">
                        <div className="w-1 h-1 bg-[#FFFFFF] rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                        <span className="text-[11px] leading-relaxed font-medium transition-colors group-hover/item:text-white">{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Acknowledgment Dark Bar */}
              <div className="bg-[#0B1739] border border-[#1E293B] rounded-lg p-3 mb-4 flex items-center gap-4 group cursor-pointer" onClick={() => setIsConfirmed(!isConfirmed)}>
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${isConfirmed ? 'bg-[#2563EB] border-[#2563EB] shadow-lg shadow-blue-600/20' : 'bg-transparent border-[#1E293B] group-hover:border-gray-500'}`}>
                  {isConfirmed && <CheckIcon className="text-white" sx={{ fontSize: 16 }} />}
                </div>
                <span className={`text-[12px] font-semibold transition-colors ${isConfirmed ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                  I confirm that I have read all the instructions carefully and am ready to take this assessment.
                </span>
              </div>

              {/* Bottom Action Bar */}
              <div className="bg-[#0B1739] border border-[#1E293B]/60 rounded-lg p-1.5 flex items-center justify-between gap-4 backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#0B1739] rounded-lg flex-1">
                  <div className="w-0 h-0 rounded-full border border-[#2563EB]/40 flex items-center justify-center flex-shrink-0 bg-[#0B1739]">
                    <InfoOutlinedIcon sx={{ fontSize: 13, color: '#38BDF8' }} />
                  </div>
                  <p className="text-[10px] text-[#38BDF8] font-medium leading-relaxed">
                    Make sure you're in a quiet environment with a stable internet connection before starting the assessment.
                  </p>
                </div>

                <button
                  onClick={handleStartInstructions}
                  disabled={!isConfirmed || generatingMcqs || phase === 'waiting'}
                  className={`min-w-[200px] h-[52px] rounded-lg transition-all duration-300 flex items-center justify-center gap-3 font-bold text-sm tracking-wide ${isConfirmed
                    ? 'bg-[#2563EB] text-white shadow-xl shadow-[0px_0px_16px_0px_rgba(37,99,235,0.80)] hover:bg-[#1D4ED8] active:scale-[0.98] hover:-translate-y-0.5'
                    : 'bg-[#1E293B] text-gray-500 cursor-not-allowed border border-white/5 opacity-80'
                    }`}
                >
                  {phase === 'waiting' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <span>Begin Assessment</span>
                      <ArrowForwardIcon sx={{ fontSize: 18 }} />
                    </>
                  )}
                </button>
              </div>
            </main>
          )}

          {phase === 'mcq' && (
            <div className="flex-1 flex flex-col min-h-0 bg-[#050D27] animate-fadeIn">
              {/* Submission Modal */}
              {isSubmitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" onClick={() => setIsSubmitModalOpen(false)} />
                  <div className="relative bg-[#0F172A] border border-[#1E293B] rounded-md p-8 max-w-sm w-full shadow-2xl animate-scaleIn">
                    <div className="w-16 h-16 bg-[#2563EB]/10 rounded-md flex items-center justify-center mx-auto mb-6">
                      <AssignmentIcon className="text-[#2563EB]" fontSize="large" />
                    </div>
                    <h3 className="text-xl font-bold text-white text-center mb-2">Submit Assessment?</h3>
                    <p className="text-gray-400 text-center text-sm mb-8">
                      Click confirm to submit your MCQ test. You won't be able to change your answers after this.
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setIsSubmitModalOpen(false)}
                        className="flex-1 px-4 py-2.5 rounded-md border border-[#1E293B] text-gray-400 font-bold text-sm hover:bg-[#1E293B] transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitMcqs}
                        className="flex-1 px-4 py-2.5 rounded-md bg-[#2563EB] text-white font-bold text-sm hover:bg-[#1D4ED8] shadow-lg shadow-blue-600/20 transition-all"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <main className="flex-1 flex flex-col overflow-hidden p-2 max-w-4xl mx-auto w-full">
                {/* Header Section */}
                <h1 className="text-lg font-bold text-white tracking-tight mb-7">Technical Assessment</h1>

                {/* Progress Tracker (Repeated from instructions but updated) */}
                <div className="flex items-center justify-between w-full mb-10 relative px-0">
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#1E293B] -translate-y-1/2 z-0" />
                  {[
                    { num: 1, label: 'Details', state: 'completed' },
                    { num: 2, label: 'Technical', state: 'active' },
                    { num: 3, label: 'Voice', state: 'pending' },
                    { num: 4, label: 'Coding', state: 'pending' }
                  ].map((step, idx) => (
                    <div key={idx} className={`flex items-center gap-2 z-10 bg-[#050D27] ${idx === 0 ? 'pr-2' : idx === 3 ? 'pl-2' : 'px-2'}`}>
                      {step.state === 'completed' ? (
                        <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center text-white ring-1 ring-white shadow-lg">
                          <CheckIcon sx={{ fontSize: 11 }} />
                        </div>
                      ) : (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[8px] shadow-lg transition-all ${step.state === 'active' ? 'bg-[#2563EB] text-white ring-1 ring-white' : 'bg-[#0B1739] text-gray-400 ring-1 ring-[#343B4F]'
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

                <div className="flex-1 flex gap-4 min-h-0">
                  {/* Left Column: Question Area */}
                  <div className="flex-[2] flex flex-col min-h-0">
                    <div className="bg-[#0B1739] border border-[#1E293B] rounded-md flex flex-col min-h-0 backdrop-blur-sm overflow-hidden mb-3">
                      {/* Question Header */}
                      <div className="px-5 py-2.5 border-b border-[#1E293B] bg-[#0B1739]">
                        <span className="text-white font-bold text-[12px] tracking-wide">Q{currentQuestionIndex + 1}/{mcqs.length}</span>
                      </div>

                      {/* Question Body */}
                      <div className="p-4 flex-1 overflow-y-auto">
                        <p className="text-[14px] font-bold text-white leading-relaxed mb-4">
                          {getCurrentQuestion()?.question}
                        </p>

                        {/* Options */}
                        <div className="space-y-1.5">
                          {getCurrentQuestion()?.options.map((option, idx) => {
                            const isSelected = isOptionSelected(option);
                            const letter = ['A', 'B', 'C', 'D'][idx];
                            return (
                              <button
                                key={idx}
                                onClick={() => handleSelectAnswer(option)}
                                className={`w-full flex items-center p-1.5 rounded-md border transition-all duration-200 group text-left ${isSelected
                                  ? 'border-[#2563EB] bg-[#2563EB]/10 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                                  : 'border-[#1E293B] bg-[#0B1739] hover:border-gray-600 hover:bg-[#0F172A]/40'
                                  }`}
                              >
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[9px] mr-4 flex-shrink-0 transition-colors ${isSelected
                                  ? 'bg-[#2563EB] text-white'
                                  : 'bg-[#0E204F] text-gray-400 group-hover:bg-[#2D3748]'
                                  }`}>
                                  {letter}
                                </div>
                                <span className={`text-[11px] font-medium leading-relaxed ${isSelected ? 'text-[#2563EB]' : 'text-gray-300'}`}>
                                  {option}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-end items-center mt-auto gap-3">
                      <button
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                        disabled={currentQuestionIndex === 0}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-[10px] font-bold border transition-all ${currentQuestionIndex === 0
                          ? 'border-[#1E293B] text-gray-600 cursor-not-allowed opacity-50'
                          : 'border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB]/10'
                          }`}
                      >
                        <ArrowBackIcon sx={{ fontSize: 14 }} />
                        Previous
                      </button>

                      {currentQuestionIndex === mcqs.length - 1 ? (
                        <button
                          onClick={() => setIsSubmitModalOpen(true)}
                          disabled={!answers[currentQuestionIndex]}
                          className={`flex items-center gap-2 px-2 py-2 rounded-md text-white font-bold text-[12px] transition-all shadow-lg active:scale-95 ${!answers[currentQuestionIndex]
                            ? 'bg-[#1E293B] text-gray-500 cursor-not-allowed border border-white/5 opacity-80'
                            : 'bg-green-600 hover:bg-green-700 shadow-green-600/20'
                            }`}
                        >
                          Submit Assessment
                        </button>
                      ) : (
                        <button
                          onClick={handleNextQuestion}
                          disabled={!answers[currentQuestionIndex]}
                          className={`flex items-center gap-2 px-2 py-2 rounded-md text-white font-bold text-[12px] transition-all shadow-lg active:scale-95 ${!answers[currentQuestionIndex]
                            ? 'bg-[#1E293B] text-gray-500 cursor-not-allowed border border-white/5 opacity-80'
                            : 'bg-[#2563EB] hover:bg-[#1D4ED8] shadow-blue-600/20'
                            }`}
                        >
                          Next Question
                          <ArrowForwardIcon sx={{ fontSize: 14 }} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Status & Preview */}
                  <div className="flex-1 flex flex-col gap-4 min-h-0 items-end">
                    {/* Camera Preview */}
                    <div className="bg-[#0F172A] border border-[#1E293B] rounded-md overflow-hidden aspect-video relative flex-shrink-0 shadow-xl w-60 h-29">
                      <CameraProctorNew
                        key={`camera-mcq-${interviewId}`}
                        autoStart={true}
                        sessionId={interviewId}
                        hideControls={true}
                        onCheatingDetected={handleCheatingDetected}
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/5">
                        <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[9px] text-white font-bold uppercase tracking-widest">Live</span>
                      </div>
                    </div>

                    {/* Question Grid Card */}
                    <div className="w-60 bg-[#0B1739] border border-[#1E293B] rounded-md px-1 py-2 flex flex-col min-h-0 backdrop-blur-sm">
                      <div className="grid grid-cols-5 justify-items-center gap-y-2 mb-0">
                        {mcqs.map((_, idx) => {
                          const isCurrent = currentQuestionIndex === idx;
                          const isDone = answers[idx] !== undefined;

                          let bgClass = "bg-[#0B1739] border-[#1E293B] text-gray-500";
                          if (isCurrent) bgClass = "bg-[#2563EB] border-[#2563EB] text-white shadow-lg shadow-blue-600/20";
                          else if (isDone) bgClass = "bg-[#22C55E] border-[#166534] text-white";

                          return (
                            <button
                              key={idx}
                              onClick={() => setCurrentQuestionIndex(idx)}
                              className={`w-7 h-7 rounded-md border flex items-center justify-center text-[9px] font-bold transition-all hover:scale-105 active:scale-95 ${bgClass}`}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Session Stats */}
                    <div className="w-60 mt-auto bg-[#0B1739] border border-[#1E293B] rounded-md p-2">
                      <h4 className="text-[11px] font-semibold text-white uppercase tracking-widest mb-1">Session Stats</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-whitw font-normal">Answered</span>
                          <span className="text-[11px] text-white font-bold">{Object.keys(answers).length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-white font-normal">Remaining</span>
                          <span className="text-[11px] text-white font-bold">{mcqs.length - Object.keys(answers).length}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-[#1E293B] pt-1 mt-0">
                          <span className="text-[11px] text-white font-normal">Question Type</span>
                          <span className="text-[11px] text-white font-bold">MCQ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          )}

          {phase === 'completed' && (
            <main className="flex-1 flex flex-col overflow-hidden px-4 py-4 max-w-4xl mx-auto w-full animate-fadeIn bg-[#050D27]">
              {/* Header Section */}
              <h1 className="text-lg font-bold text-white tracking-tight mb-5">Technical Assessment</h1>

              {/* Progress Tracker */}
              <div className="flex items-center justify-between w-full mb-5 relative px-0">
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#1E293B] -translate-y-1/2 z-0" />
                {[
                  { num: 1, label: 'Details', state: 'completed' },
                  { num: 2, label: 'Technical', state: 'completed' },
                  { num: 3, label: 'Voice', state: 'active' },
                  { num: 4, label: 'Coding', state: 'pending' }
                ].map((step, idx) => (
                  <div key={idx} className={`flex items-center gap-2 z-10 bg-[#050D27] ${idx === 0 ? 'pr-2' : idx === 3 ? 'pl-2' : 'px-2'}`}>
                    {step.state === 'completed' ? (
                      <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center text-white ring-1 ring-white shadow-lg">
                        <CheckIcon sx={{ fontSize: 11 }} />
                      </div>
                    ) : (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[8px] shadow-lg transition-all ${step.state === 'active' ? 'bg-[#2563EB] text-white ring-1 ring-white' : 'bg-[#1E293B] text-gray-400 ring-1 ring-[#343B4F]'
                        }`}>
                        {step.num}
                      </div>
                    )}
                    <span className={`text-[9px] font-bold tracking-tight ${step.state === 'active' ? 'text-white' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex-1 flex items-center justify-center p-4 relative ">
                <div className="w-90 h-[400px] max-w-sm w-full bg-[radial-gradient(ellipse_45.36%_45.36%_at_50.00%_24.95%,_#112662_0%,_#0B1739_100%)] rounded-md shadow-2xl border border-[#1E293B] px-8 text-center flex flex-col items-center relative overflow-hidden">
                  <div className="scanner-line" />
                  {/* Badge Icon */}
                  <div className="w-50 h-50 rounded-md flex items-center justify-center mb-1 relative">
                    <div className="absolute inset-0 rounded-md" />
                    <img
                      src={completedTick}
                      alt="Completed"
                      className="relative z-10 w-50 h-50 object-contain"
                    />
                  </div>

                  <h2 className="text-2xl font-semibold text-white mb-2">Assessment Completed</h2>
                  <p className="text-gray-400 text-xs mb-4 leading-relaxed max-w-[280px]">
                    Your response have been recorded.
                  </p>

                  {/* Stats Boxes */}
                  <div className="flex gap-4 mb-4 w-full">
                    <div className="flex-1 bg-[#0B1739] border border-[#1E293B] rounded-md p-3 flex flex-col items-center justify-center">
                      <span className="text-lg font-semibold text-white">{Object.keys(answers).length}/{mcqs.length}</span>
                      <span className="text-[10px] text-white font-normal tracking-wider">Attempted</span>
                    </div>
                    <div className="flex-1 bg-[#0B1739] border border-[#1E293B] rounded-md p-3 flex flex-col items-center justify-center">
                      <span className="text-lg font-semibold text-white">{formatTime(mcqTimeTaken)}</span>
                      <span className="text-[10px] text-white font-normal tracking-wider">Time Taken</span>
                    </div>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={() => navigate(`/voice-interview-instructions/${interviewId}`)}
                    className="w-full h-12 bg-[#2563EB] text-white rounded-md font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1D4ED8] transition-all shadow-[0px_0px_16px_0px_rgba(37,99,235,0.80)]"
                  >
                    Continue to Voice Interview
                    <ArrowForwardIcon sx={{ fontSize: 18 }} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </main>
          )}
        </div>
      </div>
    </div>
  );
}

export default CandidateInterview;