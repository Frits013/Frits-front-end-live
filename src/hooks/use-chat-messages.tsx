
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage, ChatMessageWithState, MultiAgentState } from "@/types/chat";

export const useChatMessages = (sessionId: string | null) => {
  const [messages, setMessages] = useState<ChatMessageWithState[]>([]);
  const { toast } = useToast();

  const loadChatMessages = async (sessionId: string) => {
    console.log('Loading messages for session:', sessionId);
    const { data: chatMessages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading chat messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
      return;
    }

    const formattedMessages: ChatMessageWithState[] = chatMessages.map(msg => {
      let multi_agent_state: MultiAgentState | undefined;
      
      // Try to parse multi_agent_state if it exists
      if (msg.multi_agent_state) {
        try {
          if (typeof msg.multi_agent_state === 'string') {
            multi_agent_state = JSON.parse(msg.multi_agent_state);
          } else {
            multi_agent_state = msg.multi_agent_state;
          }
        } catch (e) {
          console.error('Error parsing multi_agent_state:', e);
        }
      }
      
      return {
        id: msg.message_id || msg.id, // Use message_id if available, fallback to id
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        created_at: new Date(msg.created_at),
        multi_agent_state: multi_agent_state,
      };
    });

    setMessages(formattedMessages);
  };

  useEffect(() => {
    if (sessionId) {
      loadChatMessages(sessionId);
    }
  }, [sessionId]);

  return {
    messages,
    setMessages,
  };
};
