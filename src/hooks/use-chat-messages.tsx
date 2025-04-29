import { useState, useEffect } from "react";
import { ChatMessage } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";

export const useChatMessages = (sessionId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConsultComplete, setIsConsultComplete] = useState(false);

  // Fetch messages for the current session
  useEffect(() => {
    const fetchMessages = async () => {
      if (!sessionId) return;

      console.log('Loading messages for session:', sessionId);

      try {
        // First, check if the session is marked as finished
        const { data: sessionData, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('finished')
          .eq('id', sessionId)
          .single();

        if (sessionError) {
          console.error('Error fetching session status:', sessionError);
        } else if (sessionData) {
          // Update the consult complete state based on the finished column
          setIsConsultComplete(sessionData.finished);
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
          // Process the messages - only filter out system messages, keep all user and assistant messages
          const validMessages = data
            .filter(msg => msg.role !== 'system')
            .map(msg => ({
              id: msg.message_id,
              content: msg.content,
              role: msg.role,
              created_at: new Date(msg.created_at),
            }));

          console.log('Processed messages:', validMessages);
          setMessages(validMessages);
        }
      } catch (error) {
        console.error('Error in fetchMessages:', error);
      }
    };

    // Reset messages and completion state when session changes
    setMessages([]);
    setIsConsultComplete(false);
    
    fetchMessages();
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
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, isConsultComplete]);

  return {
    messages,
    setMessages,
    isConsultComplete,
    setIsConsultComplete
  };
};
