import React, { useState } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';

const SignupPage = () => {
  const navigate = useNavigate();
  
  // Form states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI control states
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation states
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!email) {
      setEmailError('Email is required');
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    } else {
      setEmailError('');
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await authService.sendSignupOTP(email);
      setSuccess(result.message);
      setOtpSent(true);
    } catch (error) {
      setError(error.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    // Validate OTP
    if (!otp) {
      setOtpError('OTP is required');
      return;
    } else if (!/^\d+$/.test(otp)) {
      setOtpError('OTP should contain only numbers');
      return;
    } else {
      setOtpError('');
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const verifyResult = await authService.verifySignupOTP(email, otp);
      setSuccess(verifyResult.message);
      setOtpVerified(true);
    } catch (error) {
      setError(error.detail || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Create account with password
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    
    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      return;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    } else {
      setPasswordError('');
    }
    
    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    } else {
      setConfirmPasswordError('');
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await authService.createAccount(email, password, confirmPassword);
      setSuccess('Account created successfully! You can now sign in.');
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      setError(error.detail || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="md" py={10}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" textAlign="center">Sign Up</Heading>
        
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert status="success">
            <AlertIcon />
            {success}
          </Alert>
        )}
        
        <Box p={6} borderWidth={1} borderRadius="lg" boxShadow="sm">
          <VStack spacing={4} align="stretch">
            {/* Step 1: Email input and Send OTP button */}
            <FormControl isInvalid={emailError}>
              <FormLabel>Email Address</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={otpSent}
                placeholder="Your email"
              />
              {emailError && <FormErrorMessage>{emailError}</FormErrorMessage>}
            </FormControl>
            
            {!otpSent ? (
              <Button
                colorScheme="blue"
                onClick={handleSendOTP}
                isLoading={loading}
                loadingText="Sending..."
                isDisabled={!email}
                width="full"
              >
                Send OTP
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setOtpSent(false);
                  setOtpVerified(false);
                  setOtp('');
                  setPassword('');
                  setConfirmPassword('');
                  setError('');
                  setSuccess('');
                }}
                isDisabled={loading}
                width="full"
              >
                Change Email
              </Button>
            )}
            
            {/* Step 2: OTP verification */}
            {otpSent && (
              <VStack spacing={4} align="stretch">
                <FormControl isInvalid={otpError}>
                  <FormLabel>Enter OTP</FormLabel>
                  <Input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={otpVerified}
                    placeholder="6-digit OTP"
                    maxLength={6}
                  />
                  {otpError && <FormErrorMessage>{otpError}</FormErrorMessage>}
                </FormControl>
                
                {!otpVerified && (
                  <Button
                    colorScheme="teal"
                    onClick={handleVerifyOTP}
                    isLoading={loading}
                    loadingText="Verifying..."
                    isDisabled={!otp}
                    width="full"
                  >
                    Verify OTP
                  </Button>
                )}
              </VStack>
            )}
            
            {/* Step 3: Password creation */}
            {otpVerified && (
              <VStack spacing={4} align="stretch">
                <FormControl isInvalid={passwordError}>
                  <FormLabel>Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                    />
                    <InputRightElement width="4.5rem">
                      <Button
                        h="1.75rem"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  {passwordError && <FormErrorMessage>{passwordError}</FormErrorMessage>}
                </FormControl>
                
                <FormControl isInvalid={confirmPasswordError}>
                  <FormLabel>Confirm Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                    />
                    <InputRightElement width="4.5rem">
                      <Button
                        h="1.75rem"
                        size="sm"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? 'Hide' : 'Show'}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  {confirmPasswordError && <FormErrorMessage>{confirmPasswordError}</FormErrorMessage>}
                </FormControl>
                
                <Button
                  colorScheme="green"
                  onClick={handleCreateAccount}
                  isLoading={loading}
                  loadingText="Creating Account..."
                  isDisabled={!password || !confirmPassword}
                  width="full"
                >
                  Create Account
                </Button>
              </VStack>
            )}
            
            {/* Login link */}
            <Text textAlign="center" mt={4}>
              Already have an account?{' '}
              <Button variant="link" colorScheme="blue" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default SignupPage;