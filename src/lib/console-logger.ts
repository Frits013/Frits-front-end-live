// Secure logging utility that prevents information disclosure in production

const isDev = import.meta.env.DEV;

export const secureLog = {
  info: (message: string, data?: any) => {
    if (isDev) {
      console.info(message, data);
    }
  },
  
  warn: (message: string, data?: any) => {
    if (isDev) {
      console.warn(message, data);
    }
  },
  
  error: (message: string, error?: any) => {
    if (isDev) {
      console.error(message, error);
    }
    // In production, you could send to a logging service here
  },
  
  debug: (message: string, data?: any) => {
    if (isDev) {
      console.debug(message, data);
    }
  }
};

// For sensitive operations, always use this instead of console.log
export const sensitiveLog = {
  auth: (message: string, userId?: string) => {
    if (isDev) {
      console.info(`[AUTH] ${message}`, userId ? { userId: userId.substring(0, 8) + '...' } : '');
    }
  },
  
  session: (message: string, sessionId?: string) => {
    if (isDev) {
      console.info(`[SESSION] ${message}`, sessionId ? { sessionId: sessionId.substring(0, 8) + '...' } : '');
    }
  }
};