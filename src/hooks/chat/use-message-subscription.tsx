
import { useEffect, useRef } from "react";
import { ChatMessage } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { INITIAL_MESSAGE } from "@/hooks/chat-sessions/use-session-creation";

const isDev = process.env.NODE_ENV !== 'production';

export const useMessageSubscription = (
  sessionId: string | null,
  messages: ChatMessage[],
  setMessages: (messages: ChatMessage[]) => void,
  setIsProcessing: (processing: boolean) => void
) => {
  const channelRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const retryDelayRef = useRef(1000);

  useEffect(() => {
    if (!sessionId) {
      // Clean up subscription when no session
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    const setupSubscription = () => {
      // Clean up existing subscription
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      if (isDev) console.log('Setting up message subscription for session:', sessionId);
      
      const channel = supabase
        .channel(`message-changes-${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `session_id=eq.${sessionId}`
          },
          (payload) => {
            if (isDev) console.log('New message received via subscription:', payload);
            
            const newMessage = payload.new;
            
            // Filter out initialization messages and non-user/assistant messages
            if (newMessage.role === 'user' && newMessage.content === INITIAL_MESSAGE) {
              return; // Skip the automatic initialization message
            }
            
            if (!['user', 'writer', 'assistant'].includes(newMessage.role)) {
              return; // Skip non-chat messages
            }
            
            const processedMessage: ChatMessage = {
              id: newMessage.message_id,
              content: newMessage.content,
              role: newMessage.role === 'writer' ? 'assistant' : newMessage.role,
              created_at: new Date(newMessage.created_at),
            };
            
            setMessages([...messages, processedMessage]);
            
            // If it's an assistant message, stop processing indicator
            if (processedMessage.role === 'assistant') {
              setIsProcessing(false);
            }
          }
        )
        .subscribe((status) => {
          if (isDev) console.log('Subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            retryCountRef.current = 0;
            retryDelayRef.current = 1000;
          } else if (status === 'CLOSED' && retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            retryDelayRef.current *= 2;
            
            if (isDev) console.log(`Subscription failed, retrying in ${retryDelayRef.current}ms (attempt ${retryCountRef.current})`);
            
            setTimeout(() => {
              if (sessionId) { // Only retry if session still exists
                setupSubscription();
              }
            }, retryDelayRef.current);
          }
        });

      channelRef.current = channel;
    };

    setupSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [sessionId]); // Only depend on sessionId, not messages

  // Separate effect to update messages when they change
  useEffect(() => {
    // This effect handles the messages dependency separately
    // to avoid recreating the subscription when messages change
  }, [messages, setMessages, setIsProcessing]);
};
