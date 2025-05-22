import { useEffect } from "react";
import { ChatMessage } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { INITIAL_MESSAGE } from "@/hooks/chat-sessions/use-session-creation";

export const useMessageSubscription = (
  sessionId: string | null, 
  messages: ChatMessage[],
  setMessages: (messages: ChatMessage[]) => void,
  setIsProcessing: (isProcessing: boolean) => void
) => {
  // Set up a subscription to listen for new messages
  useEffect(() => {
    if (!sessionId) return;
    
    // Subscribe to new messages for this session
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
              const validMessages = processMessages(data);
              console.log('Updated messages from subscription:', validMessages);
              
              // Check if payload.new exists and if so, access its properties
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
      supabase.removeChannel(messagesChannel);
    };
  }, [sessionId, setMessages, setIsProcessing]);

  const processMessages = (data: any[]): ChatMessage[] => {
    return data
      .filter(msg => {
        if (msg.role === 'user') {
          // Only filter out the specific initial message, but keep "hey" messages
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
