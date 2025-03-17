
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/types/chat";

export const useChatMessages = (sessionId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

    const formattedMessages: ChatMessage[] = chatMessages.map(msg => {
      return {
        id: msg.message_id || msg.id, // Use message_id if available, fallback to id
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        created_at: new Date(msg.created_at),
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
