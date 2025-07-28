// Production build configuration to remove console logs
// Use this utility in build process to strip console statements

import { secureLog } from './console-logger';

// Override console methods in production
if (import.meta.env.PROD) {
  // Replace console methods with secure logging in production
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.debug = () => {};
  console.error = (message: string, error?: any) => {
    // Keep error logging for critical issues but sanitize
    if (typeof message === 'string') {
      secureLog.error(message, error);
    }
  };
}

// Enhanced error boundary to prevent information disclosure
export class SecureErrorBoundary extends Error {
  constructor(message: string) {
    super(import.meta.env.PROD ? 'An error occurred' : message);
    this.name = 'SecureError';
  }
}

// Secure error reporting
export const reportSecureError = (error: Error, context?: string) => {
  if (import.meta.env.DEV) {
    secureLog.error(`Error in ${context || 'application'}:`, error);
  } else {
    // In production, log minimal information
    secureLog.error('Application error occurred', { 
      timestamp: new Date().toISOString(),
      context: context || 'unknown'
    });
  }
};
