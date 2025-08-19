
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSessionValidation = () => {
  const { toast } = useToast();

  const validateSession = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session validation error:', sessionError);
        
        // Check if it's a token expiry error
        if (sessionError.message?.includes('JWT') || sessionError.message?.includes('expired')) {
          // Attempt to refresh the session
          console.log('Attempting to refresh expired session...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (!refreshError && refreshData.session) {
            console.log('Session refreshed successfully');
            return refreshData.session;
          }
          
          toast({
            title: "Session Expired",
            description: "Please log in again",
            variant: "destructive",
          });
          return null;
        }
        
        toast({
          title: "Authentication Error",
          description: sessionError.message,
          variant: "destructive",
        });
        return null;
      }
    
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to send messages",
          variant: "destructive",
        });
        return null;
      }

      // Check if session is close to expiry (within 5 minutes)
      if (session.expires_at) {
        const expiryTime = session.expires_at * 1000;
        const currentTime = Date.now();
        const timeUntilExpiry = expiryTime - currentTime;
        
        // If session expires within 5 minutes, try to refresh
        if (timeUntilExpiry < 5 * 60 * 1000) {
          console.log('Session expiring soon, attempting refresh...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (!refreshError && refreshData.session) {
            console.log('Session proactively refreshed');
            return refreshData.session;
          }
        }
      }

      return session;
    } catch (error) {
      console.error('Unexpected session validation error:', error);
      toast({
        title: "Authentication Error",
        description: "Unable to validate session. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  return { validateSession };
};
