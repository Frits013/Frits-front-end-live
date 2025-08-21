import { useEffect, useRef } from "react";
import { ChatMessage } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";

const isDev = process.env.NODE_ENV !== 'production';

interface UseNewSessionPollingProps {
  sessionId: string | null;
  messages: ChatMessage[];
  autoMessageSent: boolean;
  sessionData: any;
  onMessagesUpdate: (messages: ChatMessage[]) => void;
}

export const useNewSessionPolling = ({
  sessionId,
  messages,
  autoMessageSent,
  sessionData,
  onMessagesUpdate
}: UseNewSessionPollingProps) => {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);

  useEffect(() => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    pollCountRef.current = 0;

    if (!sessionId || !autoMessageSent || !sessionData) {
      return;
    }

    // Check if this is a new session (created within last 60 seconds)
    const sessionCreationTime = new Date(sessionData.created_at);
    const currentTime = new Date();
    const isNewSession = (currentTime.getTime() - sessionCreationTime.getTime()) < 60000;

    // Only poll if it's a new session and we don't have any AI messages yet
    const hasAIMessages = messages.some(msg => msg.role === 'assistant');
    
    if (!isNewSession || hasAIMessages) {
      if (isDev) console.log('🔄 No polling needed - not new session or has AI messages');
      return;
    }

    console.log('🚀 Starting polling for new session:', sessionId);
    
    const pollForMessages = async () => {
      pollCountRef.current++;
      const pollCount = pollCountRef.current;
      
      if (isDev) console.log(`🔍 Polling attempt ${pollCount} for session:`, sessionId);

      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('❌ Polling error:', error);
          return;
        }

        if (data) {
          // Check for writer messages (AI responses)
          const writerMessages = data.filter(msg => msg.role === 'writer');
          
          if (writerMessages.length > 0) {
            console.log('✅ Found AI response! Stopping polling and updating messages');
            
            // Stop polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            // Process and update messages
            const processedMessages = data
              .filter(msg => msg.role !== 'user' || msg.content !== 'Hey, let me help you understand how AI can transform your workflow and improve efficiency. I\'ll ask you some questions to understand your current experience and identify the most effective AI solutions for your needs. This will take about 10-15 minutes.\n\nLet\'s start by getting to know your role and current AI usage better.')
              .map(msg => ({
                id: msg.message_id,
                content: msg.content,
                role: msg.role === 'writer' ? 'assistant' : msg.role,
                created_at: new Date(msg.created_at),
              }));

            onMessagesUpdate(processedMessages);
          } else {
            if (isDev) console.log(`🔍 Poll ${pollCount}: No AI response yet`);
          }
        }

        // Stop polling after 30 attempts (60 seconds with 2-second intervals)
        if (pollCount >= 30) {
          console.log('⏰ Polling timeout reached, stopping');
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } catch (error) {
        console.error('❌ Polling exception:', error);
      }
    };

    // Start polling every 2 seconds
    pollingIntervalRef.current = setInterval(pollForMessages, 2000);
    
    // Also poll immediately
    pollForMessages();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [sessionId, autoMessageSent, sessionData, messages.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);
};