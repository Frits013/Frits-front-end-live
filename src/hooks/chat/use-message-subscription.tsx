
import { useEffect, useRef } from "react";
import { ChatMessage } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { INITIAL_MESSAGE } from "@/hooks/chat-sessions/use-session-creation";

const isDev = process.env.NODE_ENV !== 'production';

export const useMessageSubscription = (
  sessionId: string | null, 
  messages: ChatMessage[],
  setMessages: (messages: ChatMessage[]) => void,
  setIsProcessing: (isProcessing: boolean) => void
) => {
  const subscriptionRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const baseRetryDelay = 2000;

  // Clean up function
  const cleanup = () => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    retryCountRef.current = 0;
  };

  // Fetch latest messages function
  const fetchLatestMessages = async () => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
        
      if (error) {
        if (isDev) console.error('Error loading latest messages:', error);
        return;
      }
      
      if (data) {
        const validMessages = processMessages(data);
        setMessages(validMessages);
      }
    } catch (error) {
      if (isDev) console.error('Error in fetchLatestMessages:', error);
    }
  };

  // Set up subscription with proper error handling
  const setupSubscription = () => {
    if (!sessionId || subscriptionRef.current) return;

    if (isDev) console.log('Setting up message subscription for session:', sessionId);

    const channel = supabase
      .channel(`messages-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          if (isDev) console.log('Message change detected:', payload.eventType);
          
          // Check if payload indicates assistant message completion
          const hasNewAssistantMessage = payload.new && 
            typeof payload.new === 'object' && 
            'role' in payload.new &&
            (payload.new.role === 'writer' || payload.new.role === 'assistant');
            
          if (hasNewAssistantMessage) {
            setIsProcessing(false);
          }
          
          // Fetch latest messages without excessive logging
          fetchLatestMessages();
        }
      )
      .subscribe((status) => {
        if (isDev) console.log('Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          retryCountRef.current = 0; // Reset retry counter on success
        } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
          // Implement exponential backoff retry
          if (retryCountRef.current < maxRetries) {
            const delay = baseRetryDelay * Math.pow(2, retryCountRef.current);
            retryCountRef.current++;
            
            if (isDev) console.log(`Subscription failed, retrying in ${delay}ms (attempt ${retryCountRef.current})`);
            
            retryTimeoutRef.current = setTimeout(() => {
              cleanup();
              setupSubscription();
            }, delay);
          } else {
            if (isDev) console.warn('Max subscription retries reached, giving up');
          }
        }
      });

    subscriptionRef.current = channel;
  };

  // Set up subscription when sessionId changes
  useEffect(() => {
    cleanup(); // Clean up previous subscription
    
    if (sessionId) {
      setupSubscription();
    }

    return cleanup;
  }, [sessionId]);

  const processMessages = (data: any[]): ChatMessage[] => {
    return data
      .filter(msg => {
        if (msg.role === 'user') {
          return msg.content !== INITIAL_MESSAGE;
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
  };
};
