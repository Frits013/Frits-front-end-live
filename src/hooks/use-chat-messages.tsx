
import { useState, useEffect } from "react";
import { ChatMessage } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";

export const useChatMessages = (sessionId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConsultComplete, setIsConsultComplete] = useState(false);
  const [dialogDismissed, setDialogDismissed] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);
  // Add a flag to track if automatic message was sent in a new session
  const [autoMessageSent, setAutoMessageSent] = useState(false);
  // Add a flag to track backend processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch messages for the current session
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
              
              // Only show dialog for completed sessions without feedback
              // For completed sessions with feedback, consider it "dismissed"
              setDialogDismissed(!!feedbackData);
            }
          } else {
            // For ongoing sessions, reset feedback state
            setHasFeedback(false);
            // Reset dialog dismissed state for ongoing sessions
            setDialogDismissed(false);
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
          const validMessages = data
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

          console.log('Processed messages:', validMessages);
          setMessages(validMessages);
          
          // Check if an automatic message was sent in this session
          const hasAutoMessage = data.some(msg => 
            msg.role === 'user' && msg.content === "hey"
          );
          
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
    setIsProcessing(false);
    
    fetchMessages();
    
    // Set up a polling mechanism to check for new messages regularly
    const pollInterval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [sessionId]);

  // Set up a subscription to listen for changes to the chat_sessions table
  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to changes on the specific session
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          // Check if the finished status has changed
          const newFinishedStatus = payload.new.finished;
          if (newFinishedStatus !== isConsultComplete) {
            console.log('Session finished status changed:', newFinishedStatus);
            setIsConsultComplete(newFinishedStatus);
            
            // Important: Reset dialog dismissed state when session is newly marked as complete
            if (newFinishedStatus) {
              setDialogDismissed(false);
              // We'll check if feedback exists separately
              checkFeedbackExists(sessionId);
            }
          }
        }
      )
      .subscribe();
      
    // Also subscribe to new messages for this session
    const messagesChannel = supabase
      .channel(`messages-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Message change detected:', payload);
          
          // Refresh messages when a new message is detected
          // This ensures we always have the latest messages without a page refresh
          const fetchLatestMessages = async () => {
            const { data, error } = await supabase
              .from('chat_messages')
              .select('*')
              .eq('session_id', sessionId)
              .order('created_at', { ascending: true });
              
            if (error) {
              console.error('Error loading latest messages:', error);
              return;
            }
            
            if (data) {
              const validMessages = data
                .filter(msg => {
                  if (msg.role === 'user') {
                    return msg.content !== "hey";
                  }
                  
                  if (msg.role === 'writer' || msg.role === 'assistant') {
                    return true;
                  }
                  
                  return false;
                })
                .map(msg => ({
                  id: msg.message_id,
                  content: msg.content,
                  role: msg.role === 'writer' ? 'assistant' : msg.role,
                  created_at: new Date(msg.content ? msg.created_at : null),
                }));
                
              console.log('Updated messages from subscription:', validMessages);
              
              // Fix: Check if payload.new exists and if so, access its properties
              const hasNewAssistantMessage = payload.new && 
                typeof payload.new === 'object' && 
                'role' in payload.new &&
                (payload.new.role === 'writer' || payload.new.role === 'assistant');
                
              if (hasNewAssistantMessage) {
                setIsProcessing(false);
              }
              
              setMessages(validMessages);
            }
          };
          
          fetchLatestMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(messagesChannel);
    };
  }, [sessionId, isConsultComplete]);

  // Helper function to check if feedback exists for a session
  const checkFeedbackExists = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking feedback existence:', error);
      } else {
        setHasFeedback(!!data);
        // If feedback exists, consider the dialog dismissed
        if (data) {
          setDialogDismissed(true);
        }
      }
    } catch (error) {
      console.error('Error in checkFeedbackExists:', error);
    }
  };

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
    messages,
    setMessages,
    isConsultComplete,
    setIsConsultComplete,
    dialogDismissed,
    setDialogDismissed,
    hasFeedback,
    autoMessageSent,
    isProcessing,
    setIsProcessing
  };
};
