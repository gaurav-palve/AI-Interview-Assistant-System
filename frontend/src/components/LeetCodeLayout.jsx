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
  IconButton
} from "@chakra-ui/react";
import { ChevronLeft, ChevronRight, LightMode, DarkMode } from "@mui/icons-material";
import ProblemDescription from "./ProblemDescription";
import CodeEditorPanel from "./CodeEditorPanel";
import { generateMultipleQuestions, evaluateCode } from "../services/codingService";
import { CODE_SNIPPETS } from "../constants";

const LeetCodeLayout = () => {
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
  
  // Load questions from the generator service
  const loadQuestions = async () => {
    setIsLoading(true);
    setTestResults([]);
    setShowTestResults(false);
    
    try {
      // Generate new questions using the backend API
      const newQuestions = await generateMultipleQuestions(3, 'medium');
      
      // Add solution templates for different languages if they don't exist
      const enhancedQuestions = newQuestions.map(question => {
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
      
      // Set initial code based on the first question's template
      if (enhancedQuestions.length > 0) {
        const template = enhancedQuestions[0].solutionTemplates?.[language] || 
                         enhancedQuestions[0].solutionTemplate || 
                         CODE_SNIPPETS[language];
        setCode(template);
      }
      
      toast({
        title: "Questions loaded",
        description: "Successfully generated practice questions",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error loading questions:", error);
      toast({
        title: "Error loading questions",
        description: "Failed to generate questions. Using fallback questions.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      
      // Use fallback questions if API call fails
      const fallbackQuestions = [
        {
          id: 1,
          title: "Reverse a String",
          difficulty: "easy",
          description: "Write a function that reverses a string.\n\nExample:\nInput: \"hello\"\nOutput: \"olleh\"\n\nYour function should take a string as input and return the reversed string.",
          functionSignature: "function reverseString(str)",
          solutionTemplate: "function reverseString(str) {\n  // Your code here\n  return str;\n}",
          solutionTemplates: {
            javascript: "function reverseString(str) {\n  // Your code here\n  return str;\n}",
            python: "def reverse_string(str):\n    # Your code here\n    return str",
            java: "public class Solution {\n    public static String reverseString(String str) {\n        // Your code here\n        return str;\n    }\n}",
            csharp: "public class Solution {\n    public static string ReverseString(string str) {\n        // Your code here\n        return str;\n    }\n}",
            php: "<?php\nfunction reverseString($str) {\n    // Your code here\n    return $str;\n}\n?>"
          },
          testCases: [
            {
              input: '"hello"',
              expectedOutput: '"olleh"',
              explanation: "Reversing the string 'hello' gives 'olleh'"
            },
            {
              input: '"JavaScript"',
              expectedOutput: '"tpircSavaJ"',
              explanation: "Reversing the string 'JavaScript' gives 'tpircSavaJ'"
            },
            {
              input: '"12345"',
              expectedOutput: '"54321"',
              explanation: "Reversing the string '12345' gives '54321'"
            }
          ]
        },
        {
          id: 2,
          title: "Find the Maximum Number",
          difficulty: "easy",
          description: "Write a function that finds the maximum number in an array of integers.\n\nExample:\nInput: [3, 7, 2, 9, 1]\nOutput: 9\n\nYour function should take an array of integers as input and return the largest number in the array.",
          functionSignature: "function findMax(arr)",
          solutionTemplate: "function findMax(arr) {\n  // Your code here\n  return 0;\n}",
          solutionTemplates: {
            javascript: "function findMax(arr) {\n  // Your code here\n  return 0;\n}",
            python: "def find_max(arr):\n    # Your code here\n    return 0",
            java: "public class Solution {\n    public static int findMax(int[] arr) {\n        // Your code here\n        return 0;\n    }\n}",
            csharp: "public class Solution {\n    public static int FindMax(int[] arr) {\n        // Your code here\n        return 0;\n    }\n}",
            php: "<?php\nfunction findMax($arr) {\n    // Your code here\n    return 0;\n}\n?>"
          },
          testCases: [
            {
              input: "[3, 7, 2, 9, 1]",
              expectedOutput: "9",
              explanation: "The largest number in the array [3, 7, 2, 9, 1] is 9"
            },
            {
              input: "[10, 20, 30, 40, 50]",
              expectedOutput: "50",
              explanation: "The largest number in the array [10, 20, 30, 40, 50] is 50"
            },
            {
              input: "[-5, -2, -10, -1, -8]",
              expectedOutput: "-1",
              explanation: "The largest number in the array [-5, -2, -10, -1, -8] is -1"
            }
          ]
        },
        {
          id: 3,
          title: "Count Vowels",
          difficulty: "easy",
          description: "Write a function that counts the number of vowels (a, e, i, o, u) in a given string. The function should be case-insensitive.\n\nExample:\nInput: \"Hello World\"\nOutput: 3\n\nYour function should take a string as input and return the count of vowels.",
          functionSignature: "function countVowels(str)",
          solutionTemplate: "function countVowels(str) {\n  // Your code here\n  return 0;\n}",
          solutionTemplates: {
            javascript: "function countVowels(str) {\n  // Your code here\n  return 0;\n}",
            python: "def count_vowels(str):\n    # Your code here\n    return 0",
            java: "public class Solution {\n    public static int countVowels(String str) {\n        // Your code here\n        return 0;\n    }\n}",
            csharp: "public class Solution {\n    public static int CountVowels(string str) {\n        // Your code here\n        return 0;\n    }\n}",
            php: "<?php\nfunction countVowels($str) {\n    // Your code here\n    return 0;\n}\n?>"
          },
          testCases: [
            {
              input: '"Hello World"',
              expectedOutput: "3",
              explanation: "The vowels in 'Hello World' are 'e', 'o', 'o' (3 vowels)"
            },
            {
              input: '"Programming"',
              expectedOutput: "3",
              explanation: "The vowels in 'Programming' are 'o', 'a', 'i' (3 vowels)"
            },
            {
              input: '"AEIOU"',
              expectedOutput: "5",
              explanation: "All characters in 'AEIOU' are vowels (5 vowels)"
            }
          ]
        }
      ];
      
      setQuestions(fallbackQuestions);
      setCurrentQuestionIndex(0);
      
      // Set initial code based on the first question's template
      if (fallbackQuestions.length > 0) {
        const template = fallbackQuestions[0].solutionTemplates?.[language] || 
                         fallbackQuestions[0].solutionTemplate || 
                         CODE_SNIPPETS[language];
        setCode(template);
      }
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
  const handleSubmit = () => {
    // Run tests first
    handleRunTests();
    
    // In a real application, this would submit the solution to a backend
    setTimeout(() => {
      toast({
        title: "Solution submitted",
        description: "Your solution has been submitted for evaluation",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }, 1000);
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