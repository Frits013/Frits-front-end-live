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
      let multi_agent_state: MultiAgentState | undefined = undefined;
      
      // Try to parse multi_agent_state if it exists
      if (msg.multi_agent_state) {
        try {
          if (typeof msg.multi_agent_state === 'string') {
            multi_agent_state = JSON.parse(msg.multi_agent_state);
          } else {
            multi_agent_state = msg.multi_agent_state;
          }
          
          // Ensure the multi_agent_state has the expected structure
          // If any properties are undefined, set them to default values
          if (multi_agent_state) {
            multi_agent_state = {
              reviewer_approval: multi_agent_state.reviewer_approval ?? false,
              Final_response: multi_agent_state.Final_response ?? "",
              internalconversation: multi_agent_state.internalconversation ?? [],
              Frits_run_user_prompt: multi_agent_state.Frits_run_user_prompt ?? [],
              Frits_response: multi_agent_state.Frits_response ?? [],
              RAG_input: multi_agent_state.RAG_input,
              RAG_response: multi_agent_state.RAG_response,
              reviewer_answer_check_run_message_history: multi_agent_state.reviewer_answer_check_run_message_history ?? [],
              reviewer_context_check_run_message_history: multi_agent_state.reviewer_context_check_run_message_history ?? [],
              reviewer_feedback: multi_agent_state.reviewer_feedback ?? [],
              summary: multi_agent_state.summary ?? "",
              summarizer_response: multi_agent_state.summarizer_response ?? [],
            };
          }
        } catch (e) {
          console.error('Error parsing multi_agent_state:', e);
          // Keep multi_agent_state as undefined if parsing fails
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
