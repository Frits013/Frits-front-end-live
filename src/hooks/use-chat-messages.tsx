
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

    // Improved processing for messages to ensure we capture all user messages
    const processedMessages: ChatMessage[] = [];
    const messageMap = new Map(); // Track messages by id to avoid duplicates

    chatMessages.forEach(msg => {
      // Skip system messages and empty contents
      if (!msg.content || msg.role === 'system') {
        return;
      }

      // Skip messages that look like internal conversation format
      if (typeof msg.content === 'string' && msg.content.includes('multi_agent_state')) {
        return;
      }

      // Format the message
      const formattedMessage: ChatMessage = {
        id: msg.message_id || msg.id,
        content: msg.content,
        role: msg.role,
        created_at: new Date(msg.created_at),
      };

      // Use message ID as the unique key instead of content for better uniqueness
      const messageKey = msg.message_id || msg.id;
      if (!messageMap.has(messageKey)) {
        messageMap.set(messageKey, true);
        processedMessages.push(formattedMessage);
      }
    });

    console.log('Processed messages count:', processedMessages.length);
    setMessages(processedMessages);
  };

  useEffect(() => {
    if (sessionId) {
      loadChatMessages(sessionId);
    } else {
      setMessages([]);
    }
  }, [sessionId]);

  return {
    messages,
    setMessages,
  };
};
