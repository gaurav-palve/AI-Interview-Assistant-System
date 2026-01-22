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
import { ChevronLeft, ChevronRight, LightMode, DarkMode } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
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

const LeetCodeLayout = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [timeRemaining, setTimeRemaining] = useState(500); // 40 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
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
    loadQuestions();
    // Auto-start camera on component mount
    setCameraReady(true);
  }, []);
  
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
  
  // Load questions from the database
  const loadQuestions = async () => {
    setIsLoading(true);
    setTestResults([]);
    setShowTestResults(false);
    
    // Log the interview ID
    console.log("LeetCodeLayout component mounted with interviewId:", interviewId);
    
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
      setIsLoading(false);
      return;
    }
    // No need for a toast here since we're using the exact interview ID from the URL
    
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
      // Save current code to questionCodes state
      if (editorRef.current && currentQuestion) {
        const currentCode = editorRef.current.getValue();
        setQuestionCodes(prev => ({
          ...prev,
          [currentQuestion.id]: currentCode
        }));
      }
      
      // Auto-save current answer before moving to next question
      const saveSuccess = await autoSaveCurrentAnswer();
      
      if (!saveSuccess) {
        // Notify user but still allow navigation
        toast({
          title: "Warning",
          description: "Your answer may not have been saved. You can try submitting again later.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      }
      
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      
      // Update code to the next question's template or saved code
      const nextQuestion = questions[currentQuestionIndex + 1];
      if (nextQuestion) {
        // Check if we have saved code for this question
        if (questionCodes[nextQuestion.id]) {
          setCode(questionCodes[nextQuestion.id]);
        } else {
          const template = nextQuestion.solutionTemplates?.[language] ||
                           nextQuestion.solutionTemplate ||
                           CODE_SNIPPETS[language];
          setCode(template);
        }
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
      // Save current code to questionCodes state
      if (editorRef.current && currentQuestion) {
        const currentCode = editorRef.current.getValue();
        setQuestionCodes(prev => ({
          ...prev,
          [currentQuestion.id]: currentCode
        }));
      }
      
      // Auto-save current answer before moving to previous question
      const saveSuccess = await autoSaveCurrentAnswer();
      
      if (!saveSuccess) {
        // Notify user but still allow navigation
        toast({
          title: "Warning",
          description: "Your answer may not have been saved. You can try submitting again later.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      }
      
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      
      // Update code to the previous question's template or saved code
      const prevQuestion = questions[currentQuestionIndex - 1];
      if (prevQuestion) {
        // Check if we have saved code for this question
        if (questionCodes[prevQuestion.id]) {
          setCode(questionCodes[prevQuestion.id]);
        } else {
          const template = prevQuestion.solutionTemplates?.[language] ||
                           prevQuestion.solutionTemplate ||
                           CODE_SNIPPETS[language];
          setCode(template);
        }
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
    
    // Also update the code in questionCodes for the current question
    if (currentQuestion) {
      setQuestionCodes(prev => ({
        ...prev,
        [currentQuestion.id]: newCode
      }));
    }
  };
  
  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    
    // Update code based on the new language
    if (currentQuestion) {
      const template = currentQuestion.solutionTemplates?.[newLanguage] || 
                       currentQuestion.solutionTemplate || 
                       CODE_SNIPPETS[newLanguage];
      setCode(template);
    } else {
      setCode(CODE_SNIPPETS[newLanguage] || "");
    }
    
    // Clear test results
    setTestResults([]);
    setShowTestResults(false);
  };
  
  // Handle editor mount
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };
  
  // Run test cases
  // Convert function signature based on language
  const getLanguageSpecificFunctionSignature = (jsSignature, lang) => {
    if (lang === 'javascript' || lang === 'typescript') {
      return jsSignature;
    }
    
    // Extract function name and parameters from JavaScript signature
    const functionName = jsSignature.split(' ')[1].split('(')[0];
    const params = jsSignature.split('(')[1].split(')')[0];
    
    // Convert to language-specific signature
    switch (lang) {
      case 'python':
        // Convert camelCase to snake_case for Python
        const snakeCaseName = functionName.replace(/([A-Z])/g, '_$1').toLowerCase();
        return `def ${snakeCaseName}(${params})`;
      case 'java':
        // Java methods are typically camelCase, same as JavaScript
        return `public String ${functionName}(${params})`;
      case 'csharp':
        // C# methods are typically PascalCase
        const pascalCaseName = functionName.charAt(0).toUpperCase() + functionName.slice(1);
        return `public static string ${pascalCaseName}(${params})`;
      case 'php':
        // PHP functions are typically snake_case or lowercase
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
    
    // Show completion modal
    setShowCompletionModal(true);
    
    toast({
      title: "Time's up!",
      description: saveSuccess
        ? "Your time has ended. All your answers have been saved."
        : "Your time has ended. There were issues saving some answers.",
      status: saveSuccess ? "warning" : "error",
      duration: 5000,
      isClosable: true,
    });
    
    // If save failed, try one more time after a short delay
    if (!saveSuccess) {
      setTimeout(async () => {
        const retrySuccess = await autoSaveAllAnswers();
        if (retrySuccess) {
          toast({
            title: "Success",
            description: "Your answers have been saved successfully on retry.",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      }, 3000);
    }
  };
  
  // Auto-save all answers
  const autoSaveAllAnswers = async () => {
    try {
      // First save the current question's answer to our state
      if (editorRef.current && currentQuestion) {
        const currentCode = editorRef.current.getValue();
        console.log("Auto-saving current question code:", {
          questionId: currentQuestion.id,
          codeLength: currentCode.length
        });
        setQuestionCodes(prev => ({
          ...prev,
          [currentQuestion.id]: currentCode
        }));
      }
      
      // Now save all questions' answers to the backend
      const savePromises = [];
      let saveErrors = [];
      
      // For each question, save its answer
      for (const question of questions) {
        // Get the code for this question (either from state or use template as fallback)
        const questionCode = questionCodes[question.id] ||
                           (question.solutionTemplates?.[language] ||
                            question.solutionTemplate ||
                            CODE_SNIPPETS[language]);
        
        try {
          console.log("Auto-saving question:", {
            questionId: question.id,
            questionIdType: typeof question.id,
            codeLength: questionCode.length
          });
          
          // Create a promise to save this question's answer
          const savePromise = saveCodingAnswer(
            interviewId,
            question.id,
            questionCode,
            [] // No test results for auto-save
          );
          
          savePromises.push(savePromise);
        } catch (err) {
          console.error("Error in auto-save promise creation:", err);
          saveErrors.push(`Failed to save question ${question.id}: ${err.message}`);
        }
      }
      
      // Wait for all saves to complete
      try {
        const results = await Promise.all(savePromises);
        console.log("Auto-save results:", results);
        
        if (saveErrors.length > 0) {
          console.error("Errors during auto-save:", saveErrors);
          toast({
            title: "Warning",
            description: "Some answers may not have been saved properly.",
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
          return false;
        }
        
        console.log("Auto-saved all answers as time expired");
        return true;
      } catch (promiseError) {
        console.error("Error in Promise.all for auto-save:", promiseError);
        toast({
          title: "Error",
          description: "Failed to save answers: " + promiseError.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return false;
      }
    } catch (error) {
      console.error("Error auto-saving solutions:", error);
      toast({
        title: "Error",
        description: "Failed to save your answers. Please try submitting manually.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  };
  
  // Auto-save the current answer without running tests
  const autoSaveCurrentAnswer = async () => {
    try {
      if (!editorRef.current || !currentQuestion) {
        return false;
      }
      
      // Get the current code from the editor
      const userCode = editorRef.current.getValue();
      
      try {
        // Submit the answer to the backend even if incomplete
        await saveCodingAnswer(
          interviewId,
          currentQuestion.id,
          userCode,
          testResults.length > 0 ? testResults : [] // Use empty array if no tests were run
        );
        
        console.log("Auto-saved answer for question", currentQuestion.id);
        return true;
      } catch (err) {
        console.error(`Failed to save answer for question ${currentQuestion.id}:`, err);
        return false;
      }
    } catch (error) {
      console.error("Error auto-saving solution:", error);
      toast({
        title: "Warning",
        description: "Failed to save your current answer. Your progress may not be saved.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
  };
  
  // Submit solution
  const handleSubmit = async () => {
    try {
      setIsProcessing(true);
      
      // Run tests first if not already run
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
      
      // Get the current code from the editor
      const userCode = editorRef.current.getValue();
      
      // Add detailed logging
      console.group("Submitting Coding Answer");
      console.log("Interview ID:", interviewId);
      console.log("Question ID:", currentQuestion.id);
      console.log("Question ID Type:", typeof currentQuestion.id);
      console.log("Code Length:", userCode.length);
      console.log("Test Results:", testResults);
      console.groupEnd();
      
      try {
        // Submit the answer to the backend
        const response = await saveCodingAnswer(
          interviewId,
          currentQuestion.id,
          userCode,
          testResults
        );
        
        console.log("Save Response:", response);
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
      
      // If there are more questions, prompt to move to the next one
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
        // If this is the last question, show completion modal
        setShowCompletionModal(true);
      }
    } catch (error) {
      console.error("Error submitting solution:", error);
      
      // Enhanced error logging
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      
      toast({
        title: "Error submitting solution",
        description: error.message || "An error occurred while submitting your solution",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      
      // Show a more detailed error toast with debugging information
      toast({
        title: "Debug Information",
        description: `Please report this error: ${JSON.stringify({
          interviewId: interviewId,
          questionId: currentQuestion?.id,
          error: error.message,
          status: error.response?.status
        })}`,
        status: "warning",
        duration: 10000,
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
      
      // Make API call to update interview status to completed
      const response = await fetch(`http://localhost:8000/api/candidate/complete_interview/${interviewId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        console.log("Successfully updated interview status to completed");
        toast({
          title: "Success",
          description: "Interview completed successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        console.error("Failed to update interview status to completed");
      }
    } catch (error) {
      console.error("Error updating interview status:", error);
    } finally {
      // Navigate to thank you page regardless of status update success/failure
      navigate('/interview-complete');
    }
  };
  
  // Handle end interview button click
  const handleEndInterview = async () => {
    // Show confirmation dialog
    setShowEndConfirmation(true);
  };
  
  // Handle end interview confirmation
  const handleEndInterviewConfirm = async () => {
    setIsProcessing(true);
    
    // Save all answers
    const saveSuccess = await autoSaveAllAnswers();
    
    if (saveSuccess) {
      toast({
        title: "Success",
        description: "All your answers have been saved successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Warning",
        description: "Some answers may not have been saved properly.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
    }
    
    // Close confirmation dialog and show completion modal
    setShowEndConfirmation(false);
    setShowCompletionModal(true);
    setIsProcessing(false);
  };

  return (
    <Box bg={bgColor} minH="100vh" p={4}>
      {/* Camera Component */}
      {cameraReady && (
        <CameraProctorNew 
          autoStart={true} 
          sessionId={interviewId} 
          hideControls={true} 
          onCheatingDetected={handleCheatingDetected} 
        />
      )}
      
      {/* Timer display and End Interview button */}
      <Flex justifyContent="center" mb={2} alignItems="center">
        <Box
          p={2}
          borderRadius="md"
          bg={timeRemaining < 300 ? "red.100" : "blue.100"}
          color={timeRemaining < 300 ? "red.700" : "blue.700"}
          fontWeight="bold"
          fontSize="lg"
          boxShadow="sm"
          border="1px solid"
          borderColor={timeRemaining < 300 ? "red.300" : "blue.300"}
          mr={4}
        >
          Time Remaining for All Questions: {formatTime(timeRemaining)}
        </Box>
        
        <Button
          colorScheme="red"
          onClick={handleEndInterview}
          isDisabled={isProcessing}
          size="md"
          fontWeight="bold"
          boxShadow="md"
          _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
          borderWidth="1px"
          borderColor="red.600"
        >
          End Interview
        </Button>
      </Flex>
      
      {/* Question navigation tabs */}
      <Flex mb={2} justifyContent="center">
        {questions.map((question, index) => (
          <Button
            key={index}
            onClick={async () => {
              if (currentQuestionIndex !== index) {
                // Save current question's code before switching
                if (editorRef.current && currentQuestion) {
                  const currentCode = editorRef.current.getValue();
                  setQuestionCodes(prev => ({
                    ...prev,
                    [currentQuestion.id]: currentCode
                  }));
                  
                  // Auto-save current answer before switching questions
                  const saveSuccess = await autoSaveCurrentAnswer();
                  
                  if (!saveSuccess) {
                    // Notify user but still allow navigation
                    toast({
                      title: "Warning",
                      description: "Your answer may not have been saved. You can try submitting again later.",
                      status: "warning",
                      duration: 3000,
                      isClosable: true,
                    });
                  }
                }
                
                // Switch to the selected question
                setCurrentQuestionIndex(index);
                
                // Load the code for the selected question
                const selectedQuestion = questions[index];
                if (selectedQuestion) {
                  if (questionCodes[selectedQuestion.id]) {
                    setCode(questionCodes[selectedQuestion.id]);
                  } else {
                    const template = selectedQuestion.solutionTemplates?.[language] ||
                                    selectedQuestion.solutionTemplate ||
                                    CODE_SNIPPETS[language];
                    setCode(template);
                  }
                }
                
                // Clear test results
                setTestResults([]);
                setShowTestResults(false);
              }
            }}
            colorScheme={currentQuestionIndex === index ? "green" : "gray"}
            variant={currentQuestionIndex === index ? "solid" : "outline"}
            size="sm"
            mx={1}
            borderRadius="md"
            fontWeight={currentQuestionIndex === index ? "bold" : "normal"}
          >
            Question {index + 1}
          </Button>
        ))}
      </Flex>
      
      {/* Header with problem title and navigation */}
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <HStack>
          <Heading size="md">
            Problem {currentQuestionIndex + 1}:
          </Heading>
          <Heading size="md" fontWeight="normal">
            {currentQuestion?.title || "Loading..."}
          </Heading>
          {currentQuestion && (
            <Badge 
              colorScheme={
                currentQuestion.difficulty === 'easy' ? 'green' : 
                currentQuestion.difficulty === 'medium' ? 'yellow' : 'red'
              }
              ml={2}
            >
              {currentQuestion.difficulty.toUpperCase()}
            </Badge>
          )}
        </HStack>
        <HStack>
          <IconButton
            icon={<Icon as={colorMode === 'light' ? DarkMode : LightMode} />}
            onClick={toggleColorMode}
            aria-label={`Toggle ${colorMode === 'light' ? 'Dark' : 'Light'} Mode`}
            size="sm"
            variant="solid"
            colorScheme="purple"
            mr={2}
            boxShadow="md"
            _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
            borderWidth="1px"
            borderColor="purple.400"
          />
          <Button
            leftIcon={<Icon as={ChevronLeft} />}
            onClick={prevQuestion}
            isDisabled={currentQuestionIndex === 0 || isLoading}
            size="sm"
            colorScheme="blue"
            variant="solid"
            boxShadow="md"
            _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
          >
            Previous
          </Button>
          <Button
            rightIcon={<Icon as={ChevronRight} />}
            onClick={nextQuestion}
            isDisabled={currentQuestionIndex === questions.length - 1 || isLoading}
            size="sm"
            colorScheme="blue"
            variant="solid"
            boxShadow="md"
            _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
          >
            Next
          </Button>
        </HStack>
      </Flex>
      
      <Divider mb={4} />
      
      {/* Main content area with split layout */}
      <Flex h="calc(100vh - 120px)" gap={4}>
        {/* Left panel with problem description */}
        <Box 
          w="40%" 
          bg={panelBgColor} 
          borderRadius="md" 
          border="1px" 
          borderColor={borderColor}
          overflow="auto"
        >
          <ProblemDescription 
            question={currentQuestion} 
            isLoading={isLoading} 
          />
        </Box>
        
        {/* Right panel with code editor, buttons, and test results */}
        <Box 
          ref={rightPanelRef}
          w="60%" 
          bg={panelBgColor} 
          borderRadius="md" 
          border="1px" 
          borderColor={borderColor}
          overflow="auto" // Make the entire right side scrollable
        >
          <Flex direction="column">
            {/* Code editor */}
            <Box height="65vh">
              <CodeEditorPanel 
                language={language}
                code={code}
                onCodeChange={handleCodeChange}
                onLanguageChange={handleLanguageChange}
                onEditorDidMount={handleEditorDidMount}
                question={currentQuestion}
              />
            </Box>
            
            {/* Buttons */}
            <Flex p={4} justifyContent="flex-end" borderTop="1px" borderColor={borderColor} bg={useColorModeValue("gray.50", "gray.700")}>
              <HStack spacing={3}>
                <Button
                  colorScheme="blue"
                  onClick={handleRunTests}
                  isLoading={isRunningTests}
                  isDisabled={isProcessing}
                  loadingText="Running"
                  size="md"
                  fontWeight="bold"
                  px={6}
                  boxShadow="md"
                  _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                  borderWidth="1px"
                  borderColor="blue.600"
                >
                  Run
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleSubmit}
                  isLoading={isProcessing}
                  isDisabled={isRunningTests}
                  loadingText="Submitting"
                  size="md"
                  fontWeight="bold"
                  px={6}
                  boxShadow="md"
                  _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                  borderWidth="1px"
                  borderColor="green.600"
                >
                  Submit
                </Button>
              </HStack>
            </Flex>
            
            {/* Test results below the buttons */}
            {showTestResults && (
              <Box 
                ref={testResultsRef} // Reference for auto-scrolling
                id="test-results"
                p={4} 
                borderTop="1px" 
                borderColor={borderColor}
              >
                <Heading size="sm" mb={3}>Test Results:</Heading>
                <VStack align="stretch" spacing={3}>
                  {testResults.map((result, index) => (
                    <Box 
                      key={index} 
                      p={3} 
                      borderRadius="md" 
                      bg={result.passed ? successBg : errorBg}
                      borderWidth="1px"
                      borderColor={result.passed ? "green.200" : "red.200"}
                    >
                      <HStack mb={2}>
                        <Text fontWeight="bold">Test Case {index + 1}:</Text>
                        <Badge colorScheme={result.passed ? "green" : "red"}>
                          {result.passed ? "PASSED" : "FAILED"}
                        </Badge>
                      </HStack>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm"><strong>Input:</strong> {result.input}</Text>
                        <Text fontSize="sm"><strong>Expected:</strong> {result.expected || result.expectedOutput}</Text>
                        <Text fontSize="sm"><strong>Output:</strong> {result.output || result.actualOutput}</Text>
                        {result.error && (
                          <Text fontSize="sm" color="red.500"><strong>Error:</strong> {result.error}</Text>
                        )}
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}
          </Flex>
        </Box>
      </Flex>
      
      {/* End Interview Confirmation Modal */}
      <Modal isOpen={showEndConfirmation} onClose={() => setShowEndConfirmation(false)} isCentered>
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent borderRadius="xl" boxShadow="2xl" p={2}>
          <ModalHeader textAlign="center" fontSize="xl" color="red.600">End Interview Early?</ModalHeader>
          <ModalBody>
            <Text textAlign="center" fontSize="md" mb={4}>
              Are you sure you want to end the interview now? This action cannot be undone.
            </Text>
            <Text textAlign="center" color="gray.600" mb={4}>
              All your current answers will be saved before ending the interview.
            </Text>
          </ModalBody>
          <ModalFooter justifyContent="center">
            <Button
              colorScheme="gray"
              mr={3}
              onClick={() => setShowEndConfirmation(false)}
              isDisabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleEndInterviewConfirm}
              isLoading={isProcessing}
              loadingText="Saving..."
              boxShadow="md"
              _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
            >
              End Interview
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Interview Completion Modal */}
      <Modal isOpen={showCompletionModal} onClose={() => {}} closeOnOverlayClick={false} isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent borderRadius="xl" boxShadow="2xl" p={2}>
          <ModalHeader textAlign="center" fontSize="2xl" color="green.600">Interview Complete!</ModalHeader>
          <ModalBody>
            <Center mb={6}>
              <Box
                p={4}
                borderRadius="full"
                bg="green.100"
                color="green.700"
                boxShadow="md"
              >
                <Icon as={() => (
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#38A169" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="#38A169" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )} boxSize={16} />
              </Box>
            </Center>
            <Text textAlign="center" fontSize="lg" mb={4}>
              Thank you for completing the interview!
            </Text>
            <Text textAlign="center" color="gray.600" mb={6}>
              We appreciate your time and effort. All your answers have been saved successfully. We will review your performance and be in touch with you soon.
            </Text>
            <Progress value={100} colorScheme="green" size="sm" borderRadius="full" mb={4} />
          </ModalBody>
          <ModalFooter justifyContent="center">
            <Button
              colorScheme="green"
              size="lg"
              onClick={handleInterviewComplete}
              boxShadow="md"
              _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
              px={8}
            >
              Finish
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default LeetCodeLayout;