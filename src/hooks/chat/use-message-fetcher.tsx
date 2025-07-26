import { useState, useEffect } from "react";
import { ChatMessage, ChatSession, InterviewProgress, PhaseConfig } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { INITIAL_MESSAGE } from "@/hooks/chat-sessions/use-session-creation";

const isDev = process.env.NODE_ENV !== 'production';

export const useMessageFetcher = (sessionId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConsultComplete, setIsConsultComplete] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);
  const [autoMessageSent, setAutoMessageSent] = useState(false);
  const [sessionData, setSessionData] = useState<ChatSession | null>(null);
  const [currentProgress, setCurrentProgress] = useState<InterviewProgress | null>(null);
  const [phaseConfigs, setPhaseConfigs] = useState<PhaseConfig[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!sessionId) {
        // Reset all state when no session is selected
        setMessages([]);
        setIsConsultComplete(false);
        setHasFeedback(false);
        setAutoMessageSent(false);
        return;
      }

      if (isDev) console.log('Loading messages for session:', sessionId);

      try {
        // First, fetch complete session data including phase information
        const { data: sessionResult, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (sessionError) {
          if (isDev) console.error('Error fetching session status:', sessionError);
          // Reset state on error
          setMessages([]);
          setIsConsultComplete(false);
          setHasFeedback(false);
          setAutoMessageSent(false);
          return;
        }

        if (sessionResult) {
          // Update session data and consult complete state
          setSessionData(sessionResult);
          setIsConsultComplete(sessionResult.finished);
          
          // Fetch current interview progress
          const { data: progressData, error: progressError } = await supabase
            .from('interview_progress')
            .select('*')
            .eq('session_id', sessionId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (progressError && progressError.code !== 'PGRST116') {
            if (isDev) console.error('Error fetching interview progress:', progressError);
          } else {
            setCurrentProgress(progressData);
          }

          // Fetch phase configurations (only once)
          if (phaseConfigs.length === 0) {
            const { data: configData, error: configError } = await supabase
              .from('interview_phases_config')
              .select('*')
              .order('phase');

            if (configError) {
              if (isDev) console.error('Error fetching phase configs:', configError);
            } else {
              setPhaseConfigs(configData || []);
            }
          }

          // If the session is finished, check if feedback exists
          if (sessionResult.finished) {
            const { data: feedbackData, error: feedbackError } = await supabase
              .from('feedback')
              .select('id')
              .eq('session_id', sessionId)
              .maybeSingle();
            
            if (feedbackError) {
              if (isDev) console.error('Error checking feedback existence:', feedbackError);
              setHasFeedback(false);
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
          if (isDev) console.error('Error loading messages:', error);
          setMessages([]);
          return;
        }

        if (data) {
          // Process the messages - filter out automatic initialization messages and keep only user messages and writer (assistant) responses
          const validMessages = processMessages(data);
          setMessages(validMessages);
          
          // Check if an automatic message was sent in this session
          const hasAutoMessage = data.some(msg => 
            msg.role === 'user' && msg.content === INITIAL_MESSAGE
          );
          
          // Get session creation time
          const sessionCreationTime = sessionResult ? new Date(sessionResult.created_at) : null;
          const currentTime = new Date();
          
          // Consider it a new session if created within the last 60 seconds
          const isNewSession = sessionCreationTime && 
            (currentTime.getTime() - sessionCreationTime.getTime() < 60000); 
          
          // Only set auto message flag if it's a new session with the auto message
          setAutoMessageSent(hasAutoMessage && isNewSession);
        }
      } catch (error) {
        if (isDev) console.error('Error in fetchMessages:', error);
        // Reset state on error
        setMessages([]);
        setIsConsultComplete(false);
        setHasFeedback(false);
        setAutoMessageSent(false);
        setSessionData(null);
        setCurrentProgress(null);
      }
    };

    // Always reset state first when session changes, then fetch new data
    if (sessionId) {
      // Only reset messages initially, keep other state until we fetch new data
      setMessages([]);
      fetchMessages();
    } else {
      // Reset all state when no session
      setMessages([]);
      setIsConsultComplete(false);
      setHasFeedback(false);
      setAutoMessageSent(false);
      setSessionData(null);
      setCurrentProgress(null);
    }
    
    // Set up a polling mechanism to check for new messages regularly
    const pollInterval = setInterval(() => {
      if (sessionId) {
        fetchMessages();
      }
    }, 5000);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [sessionId]); // Only depend on sessionId

  const processMessages = (data: any[]): ChatMessage[] => {
    const processed = data
      .filter(msg => {
        // Keep user messages that aren't the automatic initialization message
        if (msg.role === 'user') {
          // Only filter out the specific initial message, but keep "hey" messages
          return msg.content !== INITIAL_MESSAGE;
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

    return processed;
  };

  return {
    messages,
    setMessages,
    isConsultComplete,
    setIsConsultComplete,
    hasFeedback,
    setHasFeedback,
    autoMessageSent,
    sessionData,
    currentProgress,
    phaseConfigs
  };
};
