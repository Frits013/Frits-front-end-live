
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useProcessingState = (sessionId: string | null) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Check for processing state on messages
  useEffect(() => {
    if (!sessionId) return;

    const checkProcessingState = async () => {
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
          
          // If we have more user messages than assistant messages, we're still processing
          const shouldBeProcessing = userMessages.length > assistantMessages.length;
          setIsProcessing(shouldBeProcessing);
        }
      } catch (error) {
        console.error('Error checking processing state:', error);
      }
    };

    // Set initial processing state when session changes
    setIsProcessing(true);
    checkProcessingState();
    
    // Check processing state periodically
    const interval = setInterval(checkProcessingState, 2000);
    
    return () => clearInterval(interval);
  }, [sessionId]);

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
