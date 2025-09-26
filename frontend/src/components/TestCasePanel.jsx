import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  HStack,
  VStack,
  Divider,
  useColorModeValue
} from "@chakra-ui/react";

const TestCasePanel = ({ 
  testCases, 
  testResults, 
  isRunningTests, 
  onRunTests, 
  onSubmit,
  activeTab = 0,
  onTabChange
}) => {
  const [localActiveTab, setLocalActiveTab] = useState(activeTab);
  
  // Background colors
  const bgColor = useColorModeValue("white", "gray.800");
  const headerBgColor = useColorModeValue("gray.50", "gray.700");
  const successBg = useColorModeValue("green.50", "green.900");
  const errorBg = useColorModeValue("red.50", "red.900");
  
  // Update local active tab when prop changes
  useEffect(() => {
    setLocalActiveTab(activeTab);
  }, [activeTab]);
  
  // Handle tab change
  const handleTabChange = (index) => {
    setLocalActiveTab(index);
    if (onTabChange) {
      onTabChange(index);
    }
  };
  
  return (
    <Box height="30%" borderTopWidth="1px" borderTopColor="gray.200">
      <Tabs 
        isFitted 
        variant="enclosed" 
        colorScheme="blue" 
        size="sm"
        index={localActiveTab}
        onChange={handleTabChange}
      >
        <TabList bg={headerBgColor}>
          <Tab>Test Cases</Tab>
          <Tab>Results</Tab>
        </TabList>
        
        <TabPanels>
          {/* Test Cases Tab */}
          <TabPanel p={0}>
            <Box p={3}>
              {testCases.map((testCase, index) => (
                <Box 
                  key={index} 
                  mb={3} 
                  p={3} 
                  borderWidth="1px" 
                  borderColor="gray.200" 
                  borderRadius="md"
                >
                  <Text fontWeight="bold" mb={2}>Test Case {index + 1}</Text>
                  <VStack align="start" spacing={2}>
                    <Text><strong>Input:</strong> {testCase.input}</Text>
                    <Text><strong>Expected Output:</strong> {testCase.expectedOutput}</Text>
                    <Text><strong>Explanation:</strong> {testCase.explanation}</Text>
                  </VStack>
                </Box>
              ))}
            </Box>
            
            <Flex p={3} justifyContent="flex-end" borderTopWidth="1px" borderTopColor="gray.200">
              <HStack spacing={3}>
                <Button 
                  colorScheme="blue" 
                  size="sm" 
                  onClick={onRunTests}
                  isLoading={isRunningTests}
                  loadingText="Running"
                >
                  Run
                </Button>
                <Button 
                  colorScheme="green" 
                  size="sm"
                  onClick={onSubmit}
                >
                  Submit
                </Button>
              </HStack>
            </Flex>
          </TabPanel>
          
          {/* Results Tab */}
          <TabPanel p={0}>
            <Box p={3}>
              {testResults.length > 0 ? (
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
                        <Text fontSize="sm"><strong>Expected:</strong> {result.expected || result.expectedOutput || testCases[index]?.expectedOutput}</Text>
                        <Text fontSize="sm"><strong>Output:</strong> {result.output || result.actualOutput}</Text>
                        {result.error && (
                          <Text fontSize="sm" color="red.500"><strong>Error:</strong> {result.error}</Text>
                        )}
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Text textAlign="center" py={4}>
                  Run tests to see results here
                </Text>
              )}
            </Box>
            
            <Flex p={3} justifyContent="flex-end" borderTopWidth="1px" borderTopColor="gray.200">
              <HStack spacing={3}>
                <Button 
                  colorScheme="blue" 
                  size="sm" 
                  onClick={onRunTests}
                  isLoading={isRunningTests}
                  loadingText="Running"
                >
                  Run Again
                </Button>
                <Button 
                  colorScheme="green" 
                  size="sm"
                  onClick={onSubmit}
                >
                  Submit
                </Button>
              </HStack>
            </Flex>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default TestCasePanel;