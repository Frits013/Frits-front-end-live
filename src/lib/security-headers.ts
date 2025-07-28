// Security headers configuration for enhanced protection

export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
});

export const validateOrigin = (origin: string): boolean => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://eqjsrvbisiuysboukgnt.supabase.co',
    // Add your production domains here
  ];
  
  return allowedOrigins.includes(origin);
};

export const sanitizeHeaders = (headers: HeadersInit): HeadersInit => {
  const sanitized: HeadersInit = {};
  
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      // Only allow safe headers
      if (!/[<>"\']/.test(value) && !/[<>"\']/.test(key)) {
        (sanitized as Record<string, string>)[key] = value;
      }
    });
  } else if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => {
      if (!/[<>"\']/.test(value) && !/[<>"\']/.test(key)) {
        (sanitized as Record<string, string>)[key] = value;
      }
    });
  } else if (typeof headers === 'object' && headers !== null) {
    Object.entries(headers).forEach(([key, value]) => {
      if (value && !/[<>"\']/.test(value) && !/[<>"\']/.test(key)) {
        (sanitized as Record<string, string>)[key] = value;
      }
    });
  }
  
  return sanitized;
};