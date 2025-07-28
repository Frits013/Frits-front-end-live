// Enhanced input validation with additional security measures

import { sanitizeInput, sanitizeCompanyCode } from './input-validation';

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
}

// Enhanced text input validation
export const validateTextInput = (
  input: string, 
  options: {
    maxLength?: number;
    minLength?: number;
    allowedPatterns?: RegExp[];
    forbiddenPatterns?: RegExp[];
    required?: boolean;
  } = {}
): ValidationResult => {
  const { 
    maxLength = 5000, 
    minLength = 0, 
    allowedPatterns = [], 
    forbiddenPatterns = [],
    required = false 
  } = options;
  
  const errors: string[] = [];
  
  // Sanitize first
  const sanitized = sanitizeInput(input, maxLength);
  
  // Check if required
  if (required && !sanitized.trim()) {
    errors.push('This field is required');
  }
  
  // Check length constraints
  if (sanitized.length < minLength) {
    errors.push(`Minimum length is ${minLength} characters`);
  }
  
  if (sanitized.length > maxLength) {
    errors.push(`Maximum length is ${maxLength} characters`);
  }
  
  // Check forbidden patterns
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(sanitized)) {
      errors.push('Input contains forbidden content');
      break;
    }
  }
  
  // Check allowed patterns (if any specified)
  if (allowedPatterns.length > 0) {
    const isAllowed = allowedPatterns.some(pattern => pattern.test(sanitized));
    if (!isAllowed) {
      errors.push('Input format is not valid');
    }
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedValue: sanitized,
    errors
  };
};

// Enhanced email validation
export const validateEmailInput = (email: string): ValidationResult => {
  const sanitized = sanitizeInput(email, 254);
  const errors: string[] = [];
  
  if (!sanitized) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      errors.push('Please enter a valid email address');
    }
    
    if (sanitized.length > 254) {
      errors.push('Email is too long');
    }
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedValue: sanitized,
    errors
  };
};

// Enhanced company code validation
export const validateCompanyCodeInput = (code: string): ValidationResult => {
  const sanitized = sanitizeCompanyCode(code);
  const errors: string[] = [];
  
  if (!sanitized) {
    errors.push('Company code is required');
  } else if (sanitized.length < 4) {
    errors.push('Company code must be at least 4 digits');
  } else if (sanitized.length > 10) {
    errors.push('Company code must be no more than 10 digits');
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedValue: sanitized,
    errors
  };
};

// Secure form validation
export const validateForm = (
  fields: Record<string, { value: string; validator: (value: string) => ValidationResult }>
): { isValid: boolean; sanitizedValues: Record<string, string>; errors: Record<string, string[]> } => {
  const sanitizedValues: Record<string, string> = {};
  const errors: Record<string, string[]> = {};
  let isValid = true;
  
  for (const [fieldName, field] of Object.entries(fields)) {
    const result = field.validator(field.value);
    sanitizedValues[fieldName] = result.sanitizedValue;
    
    if (!result.isValid) {
      errors[fieldName] = result.errors;
      isValid = false;
    }
  }
  
  return { isValid, sanitizedValues, errors };
};