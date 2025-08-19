
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/hooks/use-auth-context";

export const useProcessingState = (sessionId: string | null) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { isAuthenticated, session } = useAuthContext();

  // Check for processing state on messages
  useEffect(() => {
    if (!sessionId) return;

    const checkProcessingState = async () => {
      if (!sessionId || !isAuthenticated) {
        setIsProcessing(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });
          
        if (error) {
          console.error('Error checking processing status:', error);
          return;
        }
        
        if (data) {
          // Count user messages and assistant responses
          const userMessages = data.filter(msg => msg.role === 'user');
          const assistantMessages = data.filter(msg => 
            msg.role === 'writer' || msg.role === 'assistant'
          );
          
          console.log('Processing state check:', {
            sessionId,
            userCount: userMessages.length,
            assistantCount: assistantMessages.length,
            totalMessages: data.length
          });
          
          // If we have more user messages than assistant messages, we're still processing
          // But for initial session (no user messages yet), don't process unless we're waiting
          const shouldBeProcessing = userMessages.length > assistantMessages.length;
          
          // If this is a new session with no messages or only assistant messages, not processing
          if (data.length === 0 || (userMessages.length === 0 && assistantMessages.length > 0)) {
            setIsProcessing(false);
          } else {
            setIsProcessing(shouldBeProcessing);
          }
        }
      } catch (error) {
        console.error('Error checking processing state:', error);
      }
    };

    // Check initial processing state when session changes
    checkProcessingState();
    
    // Check processing state periodically
    const interval = setInterval(checkProcessingState, 2000);
    
    return () => clearInterval(interval);
  }, [sessionId, isAuthenticated]);

  // Track visibility changes to ensure animation continues when tab is backgrounded
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && sessionId) {
        // When coming back to the tab, check if we should still be in processing state
        const checkProcessingStatus = async () => {
          try {
            const { data, error } = await supabase
              .from('chat_messages')
              .select('*')
              .eq('session_id', sessionId)
              .order('created_at', { ascending: true });
              
            if (error) {
              console.error('Error checking processing status:', error);
              return;
            }
            
            if (data) {
              const userMessages = data.filter(msg => msg.role === 'user');
              const assistantMessages = data.filter(msg => 
                msg.role === 'writer' || msg.role === 'assistant'
              );
              
              // If we have more user messages than assistant messages, we're still processing
              setIsProcessing(userMessages.length > assistantMessages.length);
            }
          } catch (error) {
            console.error('Error in visibility change handler:', error);
          }
        };
        
        checkProcessingStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionId]);

  return {
    isProcessing,
    setIsProcessing
  };
};
