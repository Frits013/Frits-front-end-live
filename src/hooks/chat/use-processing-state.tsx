
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useProcessingState = (sessionId: string | null, autoMessageSent: boolean) => {
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
          // Look for a recent "hey" message to determine if we're in automatic processing state
          const recentAutoMessage = data.find(msg => 
            msg.role === 'user' && 
            msg.content === "hey" && 
            new Date(msg.created_at).getTime() > Date.now() - 60000 // Within the last minute
          );
          
          // Check if we have a "hey" message but no corresponding assistant response yet
          const hasAutoResponse = data.some(msg => 
            (msg.role === 'writer' || msg.role === 'assistant') && 
            data.some(userMsg => 
              userMsg.role === 'user' && 
              userMsg.content === "hey" &&
              new Date(userMsg.created_at).getTime() < new Date(msg.created_at).getTime()
            )
          );
          
          // Set processing state based on whether we have a recent auto message without response
          const shouldBeProcessing = recentAutoMessage && !hasAutoResponse;
          setIsProcessing(shouldBeProcessing);
        }
      } catch (error) {
        console.error('Error checking processing state:', error);
      }
    };

    checkProcessingState();
    
    // Check processing state periodically
    const interval = setInterval(checkProcessingState, 2000);
    
    return () => clearInterval(interval);
  }, [sessionId, autoMessageSent]);

  // Track visibility changes to ensure animation continues when tab is backgrounded
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && sessionId && autoMessageSent) {
        // When coming back to the tab, check if we should still be in processing state
        const checkProcessingStatus = async () => {
          try {
            // Check if there's a "hey" message without a response
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
              // This assumes each user message should get an assistant response
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
  }, [sessionId, autoMessageSent]);

  return {
    isProcessing,
    setIsProcessing
  };
};
