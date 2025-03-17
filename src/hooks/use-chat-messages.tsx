
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

    // Process messages to remove duplicates and internal conversation
    const processedMessages: ChatMessage[] = [];
    const messageMap = new Map(); // Track messages by content to avoid duplicates

    chatMessages.forEach(msg => {
      // Skip messages with content that looks like internal conversation
      const content = msg.content;
      if (!content || content.includes('Agent') || content.includes('multi_agent_state')) {
        return;
      }

      // Only include user messages and assistant responses
      if (msg.role === 'user' || msg.role === 'assistant') {
        const formattedMessage: ChatMessage = {
          id: msg.message_id || msg.id,
          content: content,
          role: msg.role as 'user' | 'assistant',
          created_at: new Date(msg.created_at),
        };

        // Check if we already have a similar message (to avoid duplicates)
        const messageKey = `${msg.role}-${content}`;
        if (!messageMap.has(messageKey)) {
          messageMap.set(messageKey, true);
          processedMessages.push(formattedMessage);
        }
      }
    });

    setMessages(processedMessages);
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
