import { useState, useRef, useEffect } from "react";
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
  AlertIcon
} from "@chakra-ui/react";
import { ChevronLeft, ChevronRight, LightMode, DarkMode } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import ProblemDescription from "./ProblemDescription";
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
  const editorRef = useRef(null);
  const rightPanelRef = useRef(null);
  const testResultsRef = useRef(null);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(CODE_SNIPPETS.javascript || "");
  const [testResults, setTestResults] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showTestResults, setShowTestResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  
  // Get the current question
  const currentQuestion = questions[currentQuestionIndex] || null;
  
  // Background colors
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const panelBgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const successBg = useColorModeValue("green.50", "green.900");
  const errorBg = useColorModeValue("red.50", "red.900");
  
  // Load questions when component mounts
  useEffect(() => {
    loadQuestions();
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
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      
      // Update code to the next question's template
      const nextQuestion = questions[currentQuestionIndex + 1];
      if (nextQuestion) {
        const template = nextQuestion.solutionTemplates?.[language] || 
                         nextQuestion.solutionTemplate || 
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
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      
      // Update code to the previous question's template
      const prevQuestion = questions[currentQuestionIndex - 1];
      if (prevQuestion) {
        const template = prevQuestion.solutionTemplates?.[language] || 
                         prevQuestion.solutionTemplate || 
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
      
      // Submit the answer to the backend
      await saveCodingAnswer(
        interviewId,
        currentQuestion.id,
        userCode,
        testResults
      );
      
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

  return (
    <Box bg={bgColor} minH="100vh" p={4}>
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
    </Box>
  );
};

export default LeetCodeLayout;