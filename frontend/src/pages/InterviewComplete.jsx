import React from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Container,
  Button,
  useColorModeValue,
  Icon,
  Center,
  Divider,
  Flex
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const InterviewComplete = () => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const accentColor = useColorModeValue('green.500', 'green.300');

  return (
    <Flex
      bg={bgColor}
      minH="100vh"
      align="center"   // Centers vertically
      justify="center" // Centers horizontally
      py={1}
    >
      <Container maxW="container.md">
        <VStack
          spacing={8}
          bg={cardBgColor}
          p={8}
          borderRadius="xl"
          boxShadow="xl"
          border="1px"
          borderColor={borderColor}
          textAlign="center"
        >
          {/* Success Icon */}
          <Center
            bg="green.100"
            p={4}
            borderRadius="full"
            boxShadow="md"
            color="green.700"
          >
            <Icon
              viewBox="0 0 24 24"
              boxSize={16}
              strokeWidth="2"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" />
              <path d="M22 4L12 14.01L9 11.01" />
            </Icon>
          </Center>

          <Heading as="h2" size="xl" color={accentColor}>
            Interview Complete!
          </Heading>

          <Text fontSize="md" fontWeight="medium">
            Thank you for completing your interview
          </Text>

          <Divider />

          <VStack spacing={4}>
            <Text fontSize="md">
              We appreciate your time and effort in completing this interview process.
            </Text>
            <Text fontSize="md">
              Your answers have been saved successfully. Our team will review your performance and contact you soon regarding the next steps.
            </Text>
          </VStack>

          
        </VStack>
      </Container>
    </Flex>
  );
};

export default InterviewComplete;
