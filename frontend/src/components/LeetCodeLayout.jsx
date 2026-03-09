import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Flex,
  Heading,
  HStack,
  Badge,
  Button,
  Icon,
  Divider,
  Text,
  VStack,
  useToast,
  useColorModeValue,
  useColorMode,
  IconButton,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Progress,
  Center
} from "@chakra-ui/react";
import {
  ChevronLeft,
  ChevronRight,
  LightMode,
  DarkMode,
  Home as HomeIcon,
  QuestionAnswer as QuestionIcon,
  Mic as MicMuiIcon,
  School as SchoolIcon,
  Check as CheckMuiIcon,
  ArrowForward as ArrowForwardIcon,
  Menu as MenuIcon,
  Code as CodeIcon
} from "@mui/icons-material";
import { Clock } from 'lucide-react';
import { useParams, useNavigate } from "react-router-dom";
import interviewService from '../services/interviewService';
import ProblemDescription from "./ProblemDescription";
import CameraProctorNew from "./CameraProctorNew";
import CodeEditorPanel from "./CodeEditorPanel";
import {
  fetchCodingQuestions,
  evaluateCode,
  generateCodingQuestions,
  saveCodingAnswer
} from "../services/codingService";
import { CODE_SNIPPETS } from "../constants";
import CodingResults from "./CodingResults";

const INITIAL_TIME = 120; // 2 minutes

const LeetCodeLayout = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [interview, setInterview] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const editorRef = useRef(null);
  const rightPanelRef = useRef(null);
  const testResultsRef = useRef(null);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(CODE_SNIPPETS.javascript || "");
  // Track code for each question separately
  const [questionCodes, setQuestionCodes] = useState({});
  const [testResults, setTestResults] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showTestResults, setShowTestResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();

  // Timer state - 40 minutes for all questions
  const [timeRemaining, setTimeRemaining] = useState(INITIAL_TIME);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [actualTimeTaken, setActualTimeTaken] = useState(0);
  const toast = useToast();

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

  // Get the current question
  const currentQuestion = questions[currentQuestionIndex] || null;

  // Background colors
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const panelBgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const successBg = useColorModeValue("green.50", "green.900");
  const errorBg = useColorModeValue("red.50", "red.900");

  // Load questions when component mounts and auto-start camera
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await interviewService.getCandidateInterview(interviewId);
        setInterview(data);
      } catch (err) {
        console.error("Failed to load interview name:", err);
      }
      loadQuestions();
      setCameraReady(true);
    };
    loadInitialData();
  }, [interviewId]);

  // Scroll to test results when they are shown
  useEffect(() => {
    if (showTestResults && testResultsRef.current) {
      // Scroll to test results with a small delay to ensure rendering is complete
      setTimeout(() => {
        testResultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showTestResults, testResults]);

  // Timer effect
  useEffect(() => {
    let timer;
    if (isTimerRunning && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer);
            handleTimeUp();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning, timeRemaining]);

  // Synchronize code when question or language changes
  useEffect(() => {
    if (questions.length > 0 && currentQuestion) {
      const savedCode = questionCodes[currentQuestion.id]?.[language];
      let targetCode = "";

      if (savedCode !== undefined && savedCode !== null) {
        targetCode = savedCode;
      } else {
        targetCode = currentQuestion.solutionTemplates?.[language] ||
          currentQuestion.solutionTemplate ||
          CODE_SNIPPETS[language] || "";
      }

      if (targetCode !== code) {
        setCode(targetCode);
      }
    }
  }, [currentQuestionIndex, language, questions.length]); // Intentionally omit questionCodes to avoid keystroke sync

  // Load questions from the database
  const loadQuestions = async () => {
    setIsLoading(true);
    setTestResults([]);
    setShowTestResults(false);

    // Log the interview ID
    console.log("LeetCodeLayout component mounted with interviewId:", interviewId);

    if (!interviewId) {
      console.log("No interview ID provided");
      toast({
        title: "Error",
        description: "No interview ID provided. Please check the URL.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log("Fetching questions for interview ID:", interviewId);

      // Fetch questions from the database using the interview ID
      const fetchedQuestions = await fetchCodingQuestions(interviewId);

      if (!fetchedQuestions || fetchedQuestions.length === 0) {
        console.log("No questions found for interview ID:", interviewId);

        // Generate questions on the fly if none exist
        toast({
          title: "Generating questions",
          description: "No existing questions found. Generating new questions for this session.",
          status: "info",
          duration: 5000,
          isClosable: true,
        });

        // Generate new questions
        try {
          const result = await generateCodingQuestions(interviewId, 3, 'medium');
          console.log("Generated new questions:", result);

          // Fetch the newly generated questions
          const newQuestions = await fetchCodingQuestions(interviewId);

          if (!newQuestions || newQuestions.length === 0) {
            throw new Error("Failed to generate and fetch questions");
          }

          setQuestions(newQuestions);
          setCurrentQuestionIndex(0);

          // Set initial code based on the first question's template
          if (newQuestions.length > 0) {
            const template = newQuestions[0].solutionTemplates?.[language] ||
              newQuestions[0].solutionTemplate ||
              CODE_SNIPPETS[language];
            setCode(template);
          }

          setIsLoading(false);
          return;
        } catch (genError) {
          console.error("Error generating questions:", genError);
          toast({
            title: "Error",
            description: "Failed to generate questions. Please try again.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          setIsLoading(false);
          return;
        }
      }

      // Add solution templates for different languages if they don't exist
      const enhancedQuestions = fetchedQuestions.map(question => {
        // If solutionTemplates doesn't exist, create it
        if (!question.solutionTemplates) {
          const functionName = question.functionSignature.split(' ')[1].split('(')[0];
          const params = question.functionSignature.split('(')[1].split(')')[0];

          question.solutionTemplates = {
            javascript: `function ${functionName}(${params}) {\n  // Your code here\n  return null;\n}`,
            python: `def ${functionName.toLowerCase()}(${params}):\n    # Your code here\n    return None`,
            java: `public class Solution {\n    public static ${question.functionSignature} {\n        // Your code here\n        return null;\n    }\n}`,
            csharp: `public class Solution {\n    public static ${question.functionSignature} {\n        // Your code here\n        return null;\n    }\n}`,
            php: `<?php\nfunction ${functionName}(${params}) {\n    // Your code here\n    return null;\n}\n?>`
          };
        }

        return question;
      });

      setQuestions(enhancedQuestions);
      setCurrentQuestionIndex(0);

      toast({
        title: "Questions loaded",
        description: `Successfully loaded ${enhancedQuestions.length} coding questions`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Set initial code based on the first question's template
      if (enhancedQuestions.length > 0) {
        const template = enhancedQuestions[0].solutionTemplates?.[language] ||
          enhancedQuestions[0].solutionTemplate ||
          CODE_SNIPPETS[language];
        setCode(template);
      }
    } catch (error) {
      console.error("Error loading questions:", error);
      toast({
        title: "Error loading questions",
        description: `Failed to load questions: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to the next question
  const nextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      const currentEditorCode = editorRef.current?.getValue();
      const nextIndex = currentQuestionIndex + 1;
      const nextQ = questions[nextIndex];

      // 1. Save current question's code
      if (currentEditorCode && currentQuestion) {
        setQuestionCodes(prev => ({
          ...prev,
          [currentQuestion.id]: {
            ...(prev[currentQuestion.id] || {}),
            [language]: currentEditorCode
          }
        }));
        // Auto-save to backend
        await autoSaveCurrentAnswer();
      }

      // 2. Set next question and its code
      setCurrentQuestionIndex(nextIndex);

      const nextSavedCode = questionCodes[nextQ.id]?.[language];
      if (nextSavedCode) {
        setCode(nextSavedCode);
      } else {
        const template = nextQ.solutionTemplates?.[language] ||
          nextQ.solutionTemplate ||
          CODE_SNIPPETS[language];
        setCode(template);
      }

      // Clear test results
      setTestResults([]);
      setShowTestResults(false);

      // Scroll back to top of right panel
      if (rightPanelRef.current) {
        rightPanelRef.current.scrollTop = 0;
      }
    }
  };

  // Navigate to the previous question
  const prevQuestion = async () => {
    if (currentQuestionIndex > 0) {
      const currentEditorCode = editorRef.current?.getValue();
      const prevIndex = currentQuestionIndex - 1;
      const prevQ = questions[prevIndex];

      // 1. Save current question's code
      if (currentEditorCode && currentQuestion) {
        setQuestionCodes(prev => ({
          ...prev,
          [currentQuestion.id]: {
            ...(prev[currentQuestion.id] || {}),
            [language]: currentEditorCode
          }
        }));
        // Auto-save to backend
        await autoSaveCurrentAnswer();
      }

      // 2. Set previous question and its code
      setCurrentQuestionIndex(prevIndex);

      const prevSavedCode = questionCodes[prevQ.id]?.[language];
      if (prevSavedCode) {
        setCode(prevSavedCode);
      } else {
        const template = prevQ.solutionTemplates?.[language] ||
          prevQ.solutionTemplate ||
          CODE_SNIPPETS[language];
        setCode(template);
      }

      // Clear test results
      setTestResults([]);
      setShowTestResults(false);

      // Scroll back to top of right panel
      if (rightPanelRef.current) {
        rightPanelRef.current.scrollTop = 0;
      }
    }
  };

  // Handle code change
  const handleCodeChange = (newCode) => {
    setCode(newCode);

    // Also update the code in questionCodes for the current question/language
    if (currentQuestion) {
      setQuestionCodes(prev => ({
        ...prev,
        [currentQuestion.id]: {
          ...(prev[currentQuestion.id] || {}),
          [language]: newCode
        }
      }));
    }
  };

  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);

    // Clear test results
    setTestResults([]);
    setShowTestResults(false);
  };

  // Handle editor mount
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // Run test cases
  const getLanguageSpecificFunctionSignature = (jsSignature, lang) => {
    if (lang === 'javascript' || lang === 'typescript') {
      return jsSignature;
    }

    const functionName = jsSignature.split(' ')[1].split('(')[0];
    const params = jsSignature.split('(')[1].split(')')[0];

    switch (lang) {
      case 'python':
        const snakeCaseName = functionName.replace(/([A-Z])/g, '_$1').toLowerCase();
        return `def ${snakeCaseName}(${params})`;
      case 'java':
        return `public String ${functionName}(${params})`;
      case 'csharp':
        const pascalCaseName = functionName.charAt(0).toUpperCase() + functionName.slice(1);
        return `public static string ${pascalCaseName}(${params})`;
      case 'php':
        return `function ${functionName.toLowerCase()}(${params})`;
      default:
        return jsSignature;
    }
  };

  const handleRunTests = async () => {
    if (!currentQuestion || !editorRef.current) {
      toast({
        title: "Cannot run tests",
        description: "No question or code editor found",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsRunningTests(true);
    setTestResults([]);

    try {
      const userCode = editorRef.current.getValue();

      // Get language-specific function signature
      const functionSignature = getLanguageSpecificFunctionSignature(
        currentQuestion.functionSignature,
        language
      );

      // Use the backend API to evaluate the code
      const results = await evaluateCode(
        userCode,
        currentQuestion.testCases,
        language,
        functionSignature
      );

      setTestResults(results);
      setShowTestResults(true);

      // Check if all tests passed
      const allPassed = results.every(result => result.passed);

      toast({
        title: allPassed ? "All tests passed!" : "Some tests failed",
        status: allPassed ? "success" : "error",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error running tests:", error);
      toast({
        title: "Error running tests",
        description: error.message || "An error occurred while running tests",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  // Format time from seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle timer expiration
  const handleTimeUp = async () => {
    // Auto-save all answers
    const saveSuccess = await autoSaveAllAnswers();

    // Calculate actual time taken
    setActualTimeTaken(INITIAL_TIME - timeRemaining);

    // Show completion results view
    setShowResults(true);

    toast({
      title: "Time's up!",
      description: saveSuccess
        ? "Your time has ended. All your answers have been saved."
        : "Your time has ended. There were issues saving some answers.",
      status: saveSuccess ? "warning" : "error",
      duration: 5000,
      isClosable: true,
    });
  };

  // Auto-save all answers
  const autoSaveAllAnswers = async () => {
    try {
      const currentEditorCode = editorRef.current?.getValue();
      const currentQId = currentQuestion?.id;

      // Update local state for consistency
      if (currentEditorCode && currentQId) {
        setQuestionCodes(prev => ({
          ...prev,
          [currentQId]: {
            ...(prev[currentQId] || {}),
            [language]: currentEditorCode
          }
        }));
      }

      const savePromises = [];
      let saveErrors = [];

      for (const question of questions) {
        // Find the best code to save for this question
        let codeToSave = null;

        // 1. For current question, always use current editor content
        if (question.id === currentQId && currentEditorCode) {
          codeToSave = currentEditorCode;
        }
        // 2. Otherwise check if we have saved code for ANY language for this question
        else if (questionCodes[question.id]) {
          // Prefer current language if it exists
          if (questionCodes[question.id][language]) {
            codeToSave = questionCodes[question.id][language];
          } else {
            // Otherwise find any language that has significant content
            const langs = Object.keys(questionCodes[question.id]);
            const bestLang = langs.find(l => questionCodes[question.id][l].length > 50) || langs[0];
            codeToSave = questionCodes[question.id][bestLang];
          }
        }

        // 3. Fallback to template
        if (!codeToSave) {
          codeToSave = question.solutionTemplates?.[language] ||
            question.solutionTemplate ||
            CODE_SNIPPETS[language];
        }

        try {
          const savePromise = saveCodingAnswer(
            interviewId,
            question.id,
            codeToSave,
            []
          );
          savePromises.push(savePromise);
        } catch (err) {
          console.error(`Error saving question ${question.id}:`, err);
        }
      }

      try {
        await Promise.all(savePromises);
        return saveErrors.length === 0;
      } catch (promiseError) {
        console.error("Error in Promise.all for auto-save:", promiseError);
        return false;
      }
    } catch (error) {
      console.error("Error auto-saving solutions:", error);
      return false;
    }
  };

  // Auto-save the current answer
  const autoSaveCurrentAnswer = async () => {
    try {
      if (!editorRef.current || !currentQuestion) {
        return false;
      }

      const userCode = editorRef.current.getValue();

      try {
        await saveCodingAnswer(
          interviewId,
          currentQuestion.id,
          userCode,
          testResults.length > 0 ? testResults : []
        );
        return true;
      } catch (err) {
        console.error(`Failed to save answer for question ${currentQuestion.id}:`, err);
        return false;
      }
    } catch (error) {
      console.error("Error auto-saving solution:", error);
      return false;
    }
  };

  // Submit solution
  const handleSubmit = async () => {
    try {
      setIsProcessing(true);

      if (!testResults || testResults.length === 0) {
        await handleRunTests();
      }

      if (!editorRef.current || !currentQuestion) {
        toast({
          title: "Cannot submit solution",
          description: "No question or code editor found",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const userCode = editorRef.current.getValue();

      try {
        await saveCodingAnswer(
          interviewId,
          currentQuestion.id,
          userCode,
          testResults
        );
      } catch (saveError) {
        console.error("Error details:", saveError);
        throw saveError;
      }

      toast({
        title: "Solution submitted",
        description: "Your solution has been saved successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          toast({
            title: "Continue to next question?",
            description: "You can now proceed to the next question",
            status: "info",
            duration: 5000,
            isClosable: true,
          });
        }, 2000);
      } else {
        // If this is the last question, show completion view
        setActualTimeTaken(INITIAL_TIME - timeRemaining);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Error submitting solution:", error);
      toast({
        title: "Error submitting solution",
        description: error.message || "An error occurred while submitting your solution",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle interview completion
  const handleInterviewComplete = async () => {
    try {
      console.log("Updating interview status to completed for interview ID:", interviewId);
      const response = await fetch(`http://localhost:8000/api/candidate/complete_interview/${interviewId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Interview completed successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error updating interview status:", error);
    } finally {
      navigate(`/interview-complete/${interviewId}`);
    }
  };

  const handleEndInterviewConfirm = async () => {
    setIsProcessing(true);
    await autoSaveAllAnswers();
    setActualTimeTaken(INITIAL_TIME - timeRemaining);
    setShowEndConfirmation(false);
    setShowResults(true);
    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <Flex h="100vh" bg="#050D27" items="center" justify="center">
        <Box h="100vh" w="100vw" bg="#050D27" display="flex" alignItems="center" justifyContent="center">
          <Text color="white">Loading questions...</Text>
        </Box>
      </Flex>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] text-gray-300 font-sans overflow-hidden">
      {/* Sidebar - Matching Reference exactly */}
      <aside className="w-52 bg-[#081433] border-r border-white/5 flex flex-shrink-0 flex-col py-6 px-6">
        <div className="px-6 flex items-center gap-2 mb-10">
          <span className="text-white font-bold text-lg tracking-tight">RecruitIQ</span>
        </div>

        <nav className="space-y-1">
          {[
            { label: 'Dashboard', icon: HomeIcon, active: false },
            { label: 'Technical Assessment', icon: SchoolIcon, active: false },
            { label: 'Voice Interview', icon: MicMuiIcon, active: false },
            { label: 'Coding Round', icon: QuestionIcon, active: true }
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

        {/* Header - Simplified to candidate info only */}
        <header className="h-10 bg-[#08143382] border-b border-white/5 flex items-center justify-end px-6 flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[11px] font-bold text-white leading-tight">Hello, {interview?.candidate_name?.split(' ')[0] || 'Candidate'}</p>
              <p className="text-[8px] text-gray-400 font-medium uppercase tracking-wider">Candidate</p>
            </div>
            <div className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center text-gray-400 border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
              <MenuIcon sx={{ fontSize: 14 }} />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="px-10 flex-1 overflow-y-auto w-full custom-scrollbar pt-4">
          <div className="max-w-7xl mx-auto w-full">

            {/* Unified Action Bar: Title, Bubbles, Submit, and Camera*/}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-8">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {showResults ? "Coding Test" : "Coding Round"}
                </h1>
              </div>

              {!showResults && (
                <div className="flex items-center gap-6">
                  {/* Question Selection Bubbles*/}
                  <div className="flex items-center gap-2 bg-[#081433] p-1 rounded-md border border-white/5">
                    {questions.map((q, index) => {
                      const isActive = currentQuestionIndex === index;
                      const isCompleted = Object.values(questionCodes[q.id] || {}).some(code => code.length > 20);

                      return (
                        <div
                          key={index}
                          className={`w-8 h-8 flex items-center justify-center rounded-md cursor-pointer text-xs font-semibold transition-all border ${isActive ? 'bg-[#2563EB] text-white border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.4)]' :
                            isCompleted ? 'bg-[#22C55E] text-white border-green-400' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/20'
                            }`}
                          onClick={async () => {
                            if (currentQuestionIndex !== index) {
                              if (editorRef.current && currentQuestion) {
                                const currentEditorCode = editorRef.current.getValue();
                                setQuestionCodes(prev => ({
                                  ...prev,
                                  [currentQuestion.id]: {
                                    ...(prev[currentQuestion.id] || {}),
                                    [language]: currentEditorCode
                                  }
                                }));
                                await autoSaveCurrentAnswer();
                              }

                              const targetQ = questions[index];
                              setCurrentQuestionIndex(index);

                              // Load target question code locally to avoid stale state
                              const targetSavedCode = questionCodes[targetQ.id]?.[language];
                              if (targetSavedCode) {
                                setCode(targetSavedCode);
                              } else {
                                const template = targetQ.solutionTemplates?.[language] ||
                                  targetQ.solutionTemplate ||
                                  CODE_SNIPPETS[language];
                                setCode(template);
                              }
                              setTestResults([]);
                              setShowTestResults(false);
                            }
                          }}
                        >
                          {index + 1}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className="h-10 px-6 bg-[#2563EB] text-white rounded-lg font-bold text-[12px] shadow-[0px_0px_16px_0px_rgba(37,99,235,0.6)] hover:bg-blue-700 transition-all flex items-center gap-2 uppercase tracking-widest"
                  >
                    {isProcessing ? 'Submitting...' : 'Submit Coding Test'}
                    <ArrowForwardIcon sx={{ fontSize: 14 }} />
                  </button>

                  {/* Camera Preview */}
                  {cameraReady && (
                    <div className="w-32 h-20 rounded-lg border border-white/10 bg-black overflow-hidden shadow-2xl ring-1 ring-white/10">
                      <CameraProctorNew
                        autoStart={true}
                        sessionId={interviewId}
                        hideControls={true}
                        onCheatingDetected={handleCheatingDetected}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Progress Tracker - Below Action Bar */}
            <div className="flex items-center justify-between w-full relative px-0 mb-4 pt-2">
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#1E293B] -translate-y-1/2 z-0" />
              {[
                { num: 1, label: 'Details', state: 'completed' },
                { num: 2, label: 'Technical', state: 'completed' },
                { num: 3, label: 'Voice', state: 'completed' },
                { num: 4, label: 'Coding', state: showResults ? 'completed' : 'active' }
              ].map((step, idx) => (
                <div key={idx} className={`flex items-center gap-2 z-10 bg-[#050D27] ${idx === 0 ? 'pr-3' : idx === 3 ? 'pl-3' : 'px-3'}`}>
                  {(step.state === 'completed' || step.num === 1 || step.num === 2 || step.num === 3 || (step.num === 4 && showResults)) ? (
                    <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center text-white ring-1 ring-white shadow-lg">
                      <CheckMuiIcon sx={{ fontSize: 11 }} />
                    </div>
                  ) : (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shadow-lg transition-all ${step.state === 'active' ? 'bg-[#2563EB] text-white ring-1 ring-white' : 'bg-[#0B1739] text-gray-400 border border-white/5'
                      }`}>
                      {step.num}
                    </div>
                  )}
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${(step.state === 'active' || (step.num === 4 && showResults) || step.state === 'completed' || step.num < 4) ? 'text-white' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Workspace or Results */}
            {showResults ? (
              <div className="flex flex-col items-center justify-center pt-8">
                <CodingResults
                  interviewId={interviewId}
                  results={{ interview_id: interviewId, duration_seconds: actualTimeTaken }}
                  onFinish={handleInterviewComplete}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full items-stretch h-[calc(100vh-210px)] min-h-[500px]">
                {/* Left Column: Problem Details */}
                <div className="md:col-span-4 bg-[#0F172A] border border-[#1E293B] rounded-md flex flex-col overflow-hidden shadow-2xl">
                  <div className="h-10 px-6 flex items-center justify-between border-b border-white/5 bg-[#08143340]">
                    <h2 className="text-white font-bold text-[18px] tracking-tight">
                      Question {currentQuestionIndex + 1}/{questions.length}
                    </h2>
                    <div className="flex items-center gap-2 text-[#00FF88]">
                      <Clock className="w-5 h-5" />
                      <span className="font-mono font-bold text-lg tracking-tighter">{formatTime(timeRemaining)}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-sm leading-relaxed">
                    <ProblemDescription
                      question={currentQuestion}
                      isLoading={isLoading}
                    />
                  </div>
                </div>

                {/* Right Column: Editor & Output */}
                <div className="md:col-span-8 bg-[#020617] border border-[#1E293B]/20 rounded-md flex flex-col overflow-hidden shadow-2xl relative">
                  <div className="h-10 bg-[#0B1437]/80 border-b border-white/5 flex items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                      {['javascript', 'python', 'java', 'csharp', 'php'].map((lang) => (
                        <div
                          key={lang}
                          className={`px-3 py-1 rounded-md cursor-pointer text-[11px] font-bold uppercase tracking-widest transition-all ${language === lang
                            ? 'text-white bg-[#2563EB20] border border-[#2563EB40] shadow-[0_0_15px_rgba(37,99,235,0.1)]'
                            : 'text-gray-400 hover:text-gray-200'
                            }`}
                          onClick={() => handleLanguageChange(lang)}
                        >
                          {lang === 'javascript' ? 'JS' : lang === 'csharp' ? 'C#' : lang}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-6">
                      <button
                        onClick={handleRunTests}
                        disabled={isRunningTests || isProcessing}
                        className="h-6 px-4 bg-[#0B1437] hover:bg-[#16255A] text-white rounded-md text-[12px] font-bold uppercase tracking-widest border border-[#1E293B] transition-all"
                      >
                        {isRunningTests ? 'Running...' : 'Run test'}
                      </button>
                      <span className="text-[12px] text-gray-400 font-bold opacity-90">Auto Save On</span>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 bg-black">
                    <CodeEditorPanel
                      key={`${currentQuestionIndex}-${language}`}
                      language={language}
                      code={code}
                      onCodeChange={handleCodeChange}
                      onEditorDidMount={handleEditorDidMount}
                      hideHeader={true}
                      theme="vs-dark"
                    />
                  </div>

                  <div className="h-48 bg-[#000000] flex flex-col">
                    <div className="h-12 px-6 flex items-center bg-[#000000]">
                      <span className="text-[14px] font-bold text-white tracking-wide">Console Output</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#000000]">
                      {showTestResults ? (
                        <div className="space-y-3">
                          {testResults.map((result, idx) => (
                            <div key={idx} className={`p-3 rounded-md border text-[12px] leading-snug ${result.passed ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`font-bold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>Test Case {idx + 1}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${result.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{result.passed ? 'Passed' : 'Failed'}</span>
                              </div>
                              <div className="grid grid-cols-1 gap-1 text-gray-400 font-mono">
                                <div><span className="text-gray-600">Input:</span> {result.input || (currentQuestion.testCases && currentQuestion.testCases[idx]?.input)}</div>
                                <div><span className="text-gray-600">Expected:</span> {result.expectedOutput || result.expected || (currentQuestion.testCases && currentQuestion.testCases[idx]?.expectedOutput)}</div>
                                <div><span className="text-gray-600">Output:</span> {result.actualOutput || result.output || result.result}</div>
                                {result.error && <div className="text-red-400/80 mt-1 text-[11px]"><span className="text-red-400 font-bold">Error:</span> {result.error}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50">
                          <CodeIcon sx={{ fontSize: 24 }} />
                          <span className="text-[11px] font-medium uppercase tracking-widest italic">Waiting for execution...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showEndConfirmation} onClose={() => setShowEndConfirmation(false)} isCentered>
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent bg="#0F172A" color="white" borderRadius="xl" border="1px solid" borderColor="white/10">
          <ModalHeader textAlign="center" color="red.400" fontSize="md">End Session?</ModalHeader>
          <ModalBody>
            <p className="text-center text-sm text-gray-400 mb-4">Are you sure you want to end the session early? All progress will be saved.</p>
          </ModalBody>
          <ModalFooter justifyContent="center">
            <Button onClick={() => setShowEndConfirmation(false)} variant="ghost" color="gray.400">Cancel</Button>
            <Button onClick={handleEndInterviewConfirm} bg="red.600" ml={4}>End Interview</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div >
  );
};

export default LeetCodeLayout;