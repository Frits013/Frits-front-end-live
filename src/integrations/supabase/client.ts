
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eqjsrvbisiuysboukgnt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxanNydmJpc2l1eXNib3VrZ250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3MjM5NDUsImV4cCI6MjA1MzI5OTk0NX0.IGfJjbGgH_gUnxGYFAlXg9Nj09nfgSxCoH0m6twrlm8';

// Create a custom fetch function with retry logic and timeout
const customFetch = (url: RequestInfo | URL, options?: RequestInit) => {
  const fetchWithRetry = async (attempt = 0) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
      const response = await fetch(url, { 
        ...options, 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (attempt < 1) {  // Try up to 2 times total
        console.log(`Fetch attempt ${attempt + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retrying
        return fetchWithRetry(attempt + 1);
      }
      throw error;
    }
  };
  return fetchWithRetry();
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
  },
  global: {
    headers: {
      apikey: supabaseAnonKey,
    },
    // Use the custom fetch function with retry logic
    fetch: customFetch,
  },
});
