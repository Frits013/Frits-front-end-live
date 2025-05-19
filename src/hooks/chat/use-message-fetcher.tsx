import { useState, useEffect } from "react";
import { ChatMessage } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";

export const useMessageFetcher = (sessionId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConsultComplete, setIsConsultComplete] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);
  const [autoMessageSent, setAutoMessageSent] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!sessionId) return;

      console.log('Loading messages for session:', sessionId);

      try {
        // First, check if the session is marked as finished
        const { data: sessionData, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('finished, created_at')
          .eq('id', sessionId)
          .single();

        if (sessionError) {
          console.error('Error fetching session status:', sessionError);
        } else if (sessionData) {
          // Update the consult complete state based on the finished column
          setIsConsultComplete(sessionData.finished);
          
          // If the session is finished, check if feedback exists
          if (sessionData.finished) {
            const { data: feedbackData, error: feedbackError } = await supabase
              .from('feedback')
              .select('id')
              .eq('session_id', sessionId)
              .maybeSingle();
            
            if (feedbackError) {
              console.error('Error checking feedback existence:', feedbackError);
            } else {
              // Set whether this session has feedback or not
              setHasFeedback(!!feedbackData);
            }
          } else {
            // For ongoing sessions, reset feedback state
            setHasFeedback(false);
          }
        }

        // Then fetch the messages for the session
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading messages:', error);
          return;
        }

        if (data) {
          // Process the messages - filter out automatic "hey" messages and keep only user messages and writer (assistant) responses
          const validMessages = processMessages(data);
          console.log('Processed messages:', validMessages);
          setMessages(validMessages);
          
          // Check if an automatic message was sent in this session
          const hasAutoMessage = data.some(msg => 
            msg.role === 'user' && msg.content === "hey"
          );
          
          // Get session creation time
          const sessionCreationTime = sessionData ? new Date(sessionData.created_at) : null;
          const currentTime = new Date();
          
          // Consider it a new session if created within the last 60 seconds
          const isNewSession = sessionCreationTime && 
            (currentTime.getTime() - sessionCreationTime.getTime() < 60000); 
          
          // Only set auto message flag if it's a new session with the auto message
          setAutoMessageSent(hasAutoMessage && isNewSession);
        }
      } catch (error) {
        console.error('Error in fetchMessages:', error);
      }
    };

    // Reset messages when session changes
    setMessages([]);
    // Reset the autoMessageSent flag when switching sessions
    setAutoMessageSent(false);
    
    fetchMessages();
    
    // Set up a polling mechanism to check for new messages regularly
    const pollInterval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [sessionId]);

  const processMessages = (data: any[]): ChatMessage[] => {
    return data
      .filter(msg => {
        // Keep user messages that aren't automatic "hey" messages
        if (msg.role === 'user') {
          // Filter out messages with content "hey" which are our automatic messages
          return msg.content !== "hey";
        }
        
        // Keep writer messages (assistant messages for the user)
        if (msg.role === 'writer' || msg.role === 'assistant') {
          return true;
        }
        
        return false;
      })
      .map(msg => ({
        id: msg.message_id,
        content: msg.content,
        role: msg.role === 'writer' ? 'assistant' : msg.role, // Map 'writer' role to 'assistant' for UI consistency
        created_at: new Date(msg.content ? msg.created_at : null),
      }));
  };

  return {
    messages,
    setMessages,
    isConsultComplete,
    setIsConsultComplete,
    hasFeedback,
    setHasFeedback,
    autoMessageSent
  };
};
