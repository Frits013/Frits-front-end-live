import { useEffect, useRef } from "react";
import { ChatMessage } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { INITIAL_MESSAGE } from "@/hooks/chat-sessions/use-session-creation";

const isDev = true; // Always log for debugging

export const useMessageSubscription = (
  sessionId: string | null,
  messages: ChatMessage[],
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setIsProcessing: (processing: boolean) => void
) => {
  const channelRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const retryDelayRef = useRef(1000);
  const fallbackPollingRef = useRef<NodeJS.Timeout | null>(null);
  const isNewSessionRef = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      // Clean up subscription when no session
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (fallbackPollingRef.current) {
        clearInterval(fallbackPollingRef.current);
        fallbackPollingRef.current = null;
      }
      return;
    }

    // Check if this is a new session (no messages yet)
    isNewSessionRef.current = messages.length === 0;

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
            
            // Use functional update to prevent stale closure issues and improve deduplication
            setMessages((currentMessages: ChatMessage[]) => {
              const messageExists = currentMessages.some(msg => msg.id === processedMessage.id);
              if (!messageExists) {
                // Clean up fallback polling when we receive a message
                if (fallbackPollingRef.current) {
                  clearInterval(fallbackPollingRef.current);
                  fallbackPollingRef.current = null;
                }
                return [...currentMessages, processedMessage];
              }
              return currentMessages;
            });
            
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
            
            // If this is a new session, set up fallback polling
            if (isNewSessionRef.current) {
              if (isDev) console.log('Setting up fallback polling for new session');
              
              const pollForMessages = async () => {
                try {
                  const { data, error } = await supabase
                    .from('chat_messages')
                    .select('message_id, content, role, created_at')
                    .eq('session_id', sessionId)
                    .neq('role', 'user') // Don't include user messages in polling
                    .order('created_at', { ascending: true });

                  if (error) {
                    if (isDev) console.error('Error polling for messages:', error);
                    return;
                  }

                  if (data && data.length > 0) {
                    if (isDev) console.log('Found messages via polling:', data);
                    
                    const newMessages = data
                      .filter(msg => msg.content !== INITIAL_MESSAGE)
                      .map(msg => ({
                        id: msg.message_id,
                        content: msg.content,
                        role: msg.role === 'writer' ? 'assistant' as const : msg.role as 'user' | 'assistant',
                        created_at: new Date(msg.created_at),
                      }));

                    setMessages((currentMessages: ChatMessage[]) => {
                      const messagesToAdd = newMessages.filter(newMsg => 
                        !currentMessages.some(existing => existing.id === newMsg.id)
                      );
                      
                      if (messagesToAdd.length > 0) {
                        // Clean up polling when we find messages
                        if (fallbackPollingRef.current) {
                          clearInterval(fallbackPollingRef.current);
                          fallbackPollingRef.current = null;
                        }
                        setIsProcessing(false);
                        return [...currentMessages, ...messagesToAdd];
                      }
                      return currentMessages;
                    });
                  }
                } catch (error) {
                  if (isDev) console.error('Polling error:', error);
                }
              };

              // Start polling every 1 second for up to 10 seconds
              fallbackPollingRef.current = setInterval(pollForMessages, 1000);
              
              // Clean up polling after 10 seconds
              setTimeout(() => {
                if (fallbackPollingRef.current) {
                  clearInterval(fallbackPollingRef.current);
                  fallbackPollingRef.current = null;
                  if (isDev) console.log('Fallback polling timeout reached');
                }
              }, 10000);
            }
            
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

    // Add a small delay for new sessions to ensure proper setup
    const setupDelay = isNewSessionRef.current ? 100 : 0;
    
    setTimeout(() => {
      setupSubscription();
    }, setupDelay);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (fallbackPollingRef.current) {
        clearInterval(fallbackPollingRef.current);
        fallbackPollingRef.current = null;
      }
    };
  }, [sessionId]); // Only depend on sessionId, not messages

  // Separate effect to update messages when they change
  useEffect(() => {
    // This effect handles the messages dependency separately
    // to avoid recreating the subscription when messages change
  }, [messages, setMessages, setIsProcessing]);
};