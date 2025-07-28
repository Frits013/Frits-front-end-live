import DOMPurify from 'dompurify';

// Input validation and sanitization utilities

export const sanitizeInput = (input: string, maxLength: number = 5000): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Trim and limit length
  const trimmed = input.trim().slice(0, maxLength);
  
  // Remove any potential XSS patterns
  const cleaned = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  // Comprehensive HTML sanitization with strict settings
  return DOMPurify.sanitize(cleaned, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ['style', 'class', 'onclick', 'onload', 'onerror', 'onmouseover', 'onfocus'],
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'link', 'meta', 'style'],
    KEEP_CONTENT: true,
    SANITIZE_DOM: true
  });
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeCompanyCode = (code: string): string => {
  if (!code || typeof code !== 'string') return '';
  // Only allow numeric characters, strict validation
  const cleaned = code.replace(/\D/g, '').slice(0, 10);
  // Additional validation - ensure it's a valid number
  return /^\d+$/.test(cleaned) ? cleaned : '';
};

// Rate limiting helper (client-side basic implementation)
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(private maxAttempts: number = 5, private windowMs: number = 300000) {} // 5 attempts per 5 minutes
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(identifier, validAttempts);
    
    return true;
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}