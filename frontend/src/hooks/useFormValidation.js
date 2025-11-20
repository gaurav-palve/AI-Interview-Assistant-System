import { useState, useCallback } from 'react';
import { validateField, validateForm } from '../utils/validation';
 
/**
 * Custom hook for form validation
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules for each field
 * @returns {Object} - Form state and validation functions
 */
export const useFormValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
 
  /**
   * Update field value
   */
  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
   
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);
 
  /**
   * Validate single field
   */
  const validateFieldValue = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';
 
    const error = validateField(value, { ...rules, fieldName: name });
    setErrors((prev) => ({
      ...prev,
      [name]: error || undefined
    }));
 
    return error;
  }, [validationRules]);
 
  /**
   * Handle field change
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
   
    setValue(name, fieldValue);
   
    // Validate on change if field has been touched
    if (touched[name]) {
      validateFieldValue(name, fieldValue);
    }
  }, [setValue, touched, validateFieldValue]);
 
  /**
   * Handle field blur
   */
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
   
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateFieldValue(name, value);
  }, [validateFieldValue]);
 
  /**
   * Validate entire form
   */
  const validate = useCallback(() => {
    const { errors: formErrors, isValid } = validateForm(values, validationRules);
    setErrors(formErrors);
   
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(validationRules).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
   
    return isValid;
  }, [values, validationRules]);
 
  /**
   * Reset form
   */
  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);
 
  /**
   * Set field error manually
   */
  const setError = useCallback((name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error
    }));
  }, []);
 
  /**
   * Clear field error
   */
  const clearError = useCallback((name) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);
 
  return {
    values,
    errors,
    touched,
    setValue,
    handleChange,
    handleBlur,
    validate,
    reset,
    setError,
    clearError,
    isValid: Object.keys(errors).length === 0 && Object.keys(touched).length > 0
  };
};
 
 
 