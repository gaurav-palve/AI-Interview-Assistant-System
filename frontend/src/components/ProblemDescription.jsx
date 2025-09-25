import { 
  Box, 
  Text, 
  Heading, 
  VStack, 
  HStack, 
  Badge, 
  Spinner, 
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Code,
  Button,
  useColorModeValue
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

const ProblemDescription = ({ question, isLoading }) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const codeBlockBg = useColorModeValue("gray.50", "gray.700");
  
  if (isLoading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading problem...</Text>
      </Box>
    );
  }

  if (!question) {
    return (
      <Box p={6} textAlign="center">
        <Text>No problem available</Text>
      </Box>
    );
  }

  // Format the description with proper spacing and code blocks
  const formatDescription = (description) => {
    if (!description) return null;
    
    // Split by double newlines to separate paragraphs
    const paragraphs = description.split('\n\n');
    
    return paragraphs.map((paragraph, idx) => {
      // Check if this is a code example
      if (paragraph.trim().startsWith('Example:') || paragraph.trim().startsWith('Input:')) {
        return (
          <Box key={idx} my={3}>
            <Text fontWeight="bold" mb={1} fontSize="sm">{paragraph.split('\n')[0]}</Text>
            <Box
              bg={codeBlockBg}
              p={3}
              borderRadius="md"
              fontFamily="monospace"
              whiteSpace="pre"
            >
              {paragraph.split('\n').slice(1).join('\n')}
            </Box>
          </Box>
        );
      }
      
      // Regular paragraph
      return (
        <Text key={idx} my={2}>
          {paragraph}
        </Text>
      );
    });
  };

  return (
    <Box p={6} overflowY="auto" height="100%">
      <VStack align="start" spacing={4}>
        <Heading size="md">
          {question.title}
        </Heading>
        
        <HStack>
          <Box
            px={3}
            py={1}
            borderRadius="md"
            bg={
              question.difficulty === 'easy' ? 'green.500' :
              question.difficulty === 'medium' ? 'yellow.500' : 'red.500'
            }
            color="white"
            fontWeight="bold"
            fontSize="xs"
          >
            {question.difficulty.toUpperCase()}
          </Box>
          {question.topic && (
            <Box
              px={3}
              py={1}
              borderRadius="md"
              bg="blue.500"
              color="white"
              fontWeight="bold"
              fontSize="xs"
            >
              {question.topic}
            </Box>
          )}
        </HStack>
        
        <Divider />
        
        <Box width="100%">
          {formatDescription(question.description)}
        </Box>
        
        <Divider />
        
        <Box width="100%">
          <Heading size="sm" mb={3}>Examples:</Heading>
          
          {question.testCases && question.testCases.slice(0, 3).map((testCase, index) => (
            <Box 
              key={index} 
              mb={4} 
              p={3} 
              bg={codeBlockBg} 
              borderRadius="md"
            >
              <Text fontWeight="bold">Example {index + 1}:</Text>
              <Box fontFamily="monospace" mt={2} >
                <Text><strong>Input:</strong> {testCase.input}</Text>
                <Text><strong>Output:</strong> {testCase.expectedOutput}</Text>
                <Text mt={2}><strong>Explanation:</strong> {testCase.explanation}</Text>
              </Box>
            </Box>
          ))}
        </Box>
        
        <Divider />
        
        <Box width="100%">
          <Heading size="sm" mb={3}>Constraints:</Heading>
          <Text>
            • You must implement the solution without using built-in library functions.
          </Text>
          <Text >
            • Your solution should work for all valid inputs.
          </Text>
        </Box>
        
        <Divider />
        
        <Box width="100%">
          <Heading size="sm" mb={3}>Function Signature:</Heading>
          <Code p={3} borderRadius="md" display="block" bg={codeBlockBg}>
            {question.functionSignature}
          </Code>
        </Box>
      </VStack>
    </Box>
  );
};

export default ProblemDescription;