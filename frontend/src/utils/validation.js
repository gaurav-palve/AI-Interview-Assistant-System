/**
 * Validation utility functions for form validation
 */
 
/**
 * Email validation
 */
export const validateEmail = (email) => {
  if (!email) {
    return 'Email is required';
  }
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return '';
};
 
/**
 * Password validation
 */
export const validatePassword = (password, minLength = 8) => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters long`;
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/(?=.*\d)/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return 'Password must contain at least one special character (@$!%*?&)';
  }
  return '';
};
 
/**
 * Confirm password validation
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return '';
};
 
/**
 * Required field validation
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return '';
};
 
/**
 * Minimum length validation
 */
export const validateMinLength = (value, minLength, fieldName = 'This field') => {
  if (!value) {
    return `${fieldName} is required`;
  }
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters long`;
  }
  return '';
};
 
/**
 * Maximum length validation
 */
export const validateMaxLength = (value, maxLength, fieldName = 'This field') => {
  if (value && value.length > maxLength) {
    return `${fieldName} must not exceed ${maxLength} characters`;
  }
  return '';
};
 
/**
 * Number validation
 */
export const validateNumber = (value, fieldName = 'This field') => {
  if (!value) {
    return `${fieldName} is required`;
  }
  if (isNaN(value) || value === '') {
    return `${fieldName} must be a valid number`;
  }
  return '';
};
 
/**
 * Positive number validation
 */
export const validatePositiveNumber = (value, fieldName = 'This field') => {
  const numberError = validateNumber(value, fieldName);
  if (numberError) return numberError;
  if (parseFloat(value) <= 0) {
    return `${fieldName} must be greater than 0`;
  }
  return '';
};
 
/**
 * URL validation
 */
export const validateURL = (url, fieldName = 'URL') => {
  if (!url) {
    return `${fieldName} is required`;
  }
  try {
    new URL(url);
    return '';
  } catch {
    return 'Please enter a valid URL';
  }
};
 
/**
 * Phone number validation
 */
export const validatePhone = (phone, fieldName = 'Phone number') => {
  if (!phone) {
    return `${fieldName} is required`;
  }
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    return 'Please enter a valid phone number';
  }
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return 'Phone number must contain at least 10 digits';
  }
  return '';
};
 
/**
 * Date validation
 */
export const validateDate = (date, fieldName = 'Date') => {
  if (!date) {
    return `${fieldName} is required`;
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Please enter a valid date';
  }
  return '';
};
 
/**
 * Future date validation
 */
export const validateFutureDate = (date, fieldName = 'Date') => {
  const dateError = validateDate(date, fieldName);
  if (dateError) return dateError;
  const dateObj = new Date(date);
  if (dateObj <= new Date()) {
    return `${fieldName} must be a future date`;
  }
  return '';
};
 
/**
 * Past date validation
 */
export const validatePastDate = (date, fieldName = 'Date') => {
  const dateError = validateDate(date, fieldName);
  if (dateError) return dateError;
  const dateObj = new Date(date);
  if (dateObj >= new Date()) {
    return `${fieldName} must be a past date`;
  }
  return '';
};
 
/**
 * Array validation (for skills, requirements, etc.)
 */
export const validateArray = (array, minItems = 1, fieldName = 'This field') => {
  if (!array || !Array.isArray(array)) {
    return `${fieldName} must be an array`;
  }
  if (array.length < minItems) {
    return `${fieldName} must have at least ${minItems} item${minItems > 1 ? 's' : ''}`;
  }
  return '';
};
 
/**
 * File validation
 */
export const validateFile = (file, allowedTypes = [], maxSizeMB = 10, fieldName = 'File') => {
  if (!file) {
    return `${fieldName} is required`;
  }
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
  }
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `File size must be less than ${maxSizeMB}MB`;
  }
  return '';
};
 
/**
 * Combined validation function
 */
export const validateField = (value, rules = {}) => {
  const {
    required = false,
    email = false,
    password = false,
    minLength = null,
    maxLength = null,
    number = false,
    positiveNumber = false,
    url = false,
    phone = false,
    date = false,
    futureDate = false,
    pastDate = false,
    custom = null,
    fieldName = 'This field'
  } = rules;
 
  // Required validation
  if (required) {
    const requiredError = validateRequired(value, fieldName);
    if (requiredError) return requiredError;
  }
 
  // Skip other validations if field is empty and not required
  if (!value && !required) {
    return '';
  }
 
  // Email validation
  if (email) {
    const emailError = validateEmail(value);
    if (emailError) return emailError;
  }
 
  // Password validation
  if (password) {
    const passwordError = validatePassword(value, minLength || 8);
    if (passwordError) return passwordError;
  }
 
  // Min length validation
  if (minLength !== null && typeof value === 'string') {
    const minLengthError = validateMinLength(value, minLength, fieldName);
    if (minLengthError) return minLengthError;
  }
 
  // Max length validation
  if (maxLength !== null && typeof value === 'string') {
    const maxLengthError = validateMaxLength(value, maxLength, fieldName);
    if (maxLengthError) return maxLengthError;
  }
 
  // Number validation
  if (number) {
    const numberError = validateNumber(value, fieldName);
    if (numberError) return numberError;
  }
 
  // Positive number validation
  if (positiveNumber) {
    const positiveNumberError = validatePositiveNumber(value, fieldName);
    if (positiveNumberError) return positiveNumberError;
  }
 
  // URL validation
  if (url) {
    const urlError = validateURL(value, fieldName);
    if (urlError) return urlError;
  }
 
  // Phone validation
  if (phone) {
    const phoneError = validatePhone(value, fieldName);
    if (phoneError) return phoneError;
  }
 
  // Date validation
  if (date) {
    const dateError = validateDate(value, fieldName);
    if (dateError) return dateError;
  }
 
  // Future date validation
  if (futureDate) {
    const futureDateError = validateFutureDate(value, fieldName);
    if (futureDateError) return futureDateError;
  }
 
  // Past date validation
  if (pastDate) {
    const pastDateError = validatePastDate(value, fieldName);
    if (pastDateError) return pastDateError;
  }
 
  // Custom validation
  if (custom && typeof custom === 'function') {
    const customError = custom(value);
    if (customError) return customError;
  }
 
  return '';
};
 
/**
 * Validate entire form
 */
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isValid = true;
 
  Object.keys(validationRules).forEach((fieldName) => {
    const rules = validationRules[fieldName];
    const value = formData[fieldName];
    const error = validateField(value, { ...rules, fieldName });
   
    if (error) {
      errors[fieldName] = error;
      isValid = false;
    }
  });
 
  return { errors, isValid };
};
 
 