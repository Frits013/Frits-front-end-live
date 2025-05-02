
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eqjsrvbisiuysboukgnt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxanNydmJpc2l1eXNib3VrZ250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3MjM5NDUsImV4cCI6MjA1MzI5OTk0NX0.IGfJjbGgH_gUnxGYFAlXg9Nj09nfgSxCoH0m6twrlm8';

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
  },
  // Add retry logic for network failures
  fetch: (url, options) => {
    const fetchWithRetry = async (attempt = 0) => {
      try {
        return await fetch(url, options);
      } catch (error) {
        if (attempt < 2) {  // Try up to 3 times total
          console.log(`Fetch attempt ${attempt + 1} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retrying
          return fetchWithRetry(attempt + 1);
        }
        throw error;
      }
    };
    return fetchWithRetry();
  }
});
