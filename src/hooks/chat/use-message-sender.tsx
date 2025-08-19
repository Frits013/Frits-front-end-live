import { useRef } from "react";
import { ChatMessage, InterviewPhase } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { INITIAL_MESSAGE } from "@/hooks/chat-sessions/use-session-creation";

const isDev = process.env.NODE_ENV !== 'production';

interface UseMessageSenderProps {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  currentChatId: string | null;
  setErrorMessage: (error: string | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  isThinkingRef: React.MutableRefObject<boolean>;
  currentPhase?: InterviewPhase;
}

export const useMessageSender = ({
  messages,
  setMessages,
  currentChatId,
  setErrorMessage,
  setIsProcessing,
  isThinkingRef,
  currentPhase
}: UseMessageSenderProps) => {
  const currentRequestId = useRef<string | null>(null);

  const getPhaseContextMessage = (userAnswer: string, phase: InterviewPhase): string => {
    // Special hardcoded prompts for summary and recommendations phases
    if (phase === 'summary') {
      return "YOU ARE NOW IN THE SUMMARY PHASE I WANT YOU TO WRITE A SUMMARY FOR THE USER ABOUT THE AI READINESS CONVERSATION YOU JUST HAD WITH INTERESTING FINDINGS AND TOPICS YOU THOUGHT WERE UNIQUE/INTERESTING.";
    }
    
    if (phase === 'recommendations') {
      return "PROVIDE ACTIONABLE RECOMMENDATIONS BASED ON THE CONVERSATION...";
    }
    
    // Standard phase context for other phases
    return `The next question you will ask will be from the ${phase} phase. You are in that part of the interview process KEEP THIS INTO ACCOUNT. "This was the user's last answer: ${userAnswer}."`;
  };

  const sendMessage = async (inputMessage: string) => {
    if (!inputMessage.trim() || !currentChatId) {
      if (isDev) console.warn('Cannot send message: empty message or no chat ID');
      return;
    }

    // Generate unique request ID to prevent duplicates
    const requestId = Math.random().toString(36).substring(7);
    currentRequestId.current = requestId;

    setIsProcessing(true);
    setErrorMessage(null);
    isThinkingRef.current = true;

    try {
      // Create user message immediately for UI
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        content: inputMessage,
        role: 'user',
        created_at: new Date(),
      };

      // Add user message to UI immediately
      setMessages([...messages, userMessage]);

      // Save user message to database
      const { data: savedUserMessage, error: userMessageError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: currentChatId,
          content: inputMessage,
          role: 'user',
        })
        .select()
        .single();

      if (userMessageError) {
        if (isDev) console.error('Error saving user message:', userMessageError);
        toast.error('Failed to save your message');
        return;
      }

      // Prepare the message with phase context
      let messageToSend = inputMessage;
      if (currentPhase) {
        const phaseContext = getPhaseContextMessage(inputMessage, currentPhase);
        messageToSend = `${phaseContext}\n\nUser's answer: ${inputMessage}`;
      }

      // Call the chat function with phase context
      const { data: chatResponse, error: functionError } = await supabase.functions.invoke('chat', {
        body: {
          message: messageToSend,
          session_id: currentChatId,
        },
      });

      // Check if this is still the current request
      if (currentRequestId.current !== requestId) {
        if (isDev) console.log('Request superseded, ignoring response');
        return;
      }

      if (functionError) {
        if (isDev) console.error('Function invocation error:', functionError);
        toast.error('Failed to get response from AI');
        setErrorMessage('Failed to get AI response. Please try again.');
        return;
      }

      if (chatResponse?.error) {
        if (isDev) console.error('Chat function returned error:', chatResponse.error);
        toast.error('AI returned an error');
        setErrorMessage(chatResponse.error);
        return;
      }

      if (!chatResponse?.response) {
        if (isDev) console.error('No response from chat function');
        toast.error('No response received');
        setErrorMessage('No response received from AI');
        return;
      }

      // Retrieve the assistant's response from the database (stored as 'writer' role)
      const { data: assistantMessages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', currentChatId)
        .eq('role', 'writer') // Fixed: Look for 'writer' role, not 'assistant'
        .order('created_at', { ascending: false })
        .limit(1);

      if (messagesError) {
        if (isDev) console.error('Error fetching assistant message:', messagesError);
        toast.error('Failed to retrieve AI response');
        return;
      }

      if (assistantMessages && assistantMessages.length > 0) {
        const latestAssistantMessage = assistantMessages[0];
        
        // Update messages with the real assistant message
        const { data: allMessages, error: allMessagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', currentChatId)
          .order('created_at', { ascending: true });

        if (!allMessagesError && allMessages) {
          // Filter and map messages like the message fetcher does
          const formattedMessages: ChatMessage[] = allMessages
            .filter(msg => {
              // Keep user messages that aren't the automatic initialization message
              if (msg.role === 'user') {
                return msg.content !== INITIAL_MESSAGE;
              }
              
              // Keep writer messages (assistant messages for the user)
              if (msg.role === 'writer' || msg.role === 'assistant') {
                return true;
              }
              
              return false;
            })
            .map(msg => ({
              id: msg.message_id,
              content: msg.content,
              role: msg.role === 'writer' ? 'assistant' : msg.role, // Map 'writer' role to 'assistant' for UI consistency
              created_at: new Date(msg.created_at),
            }));
          setMessages(formattedMessages);
        }

        if (isDev) console.log('Message sent and response received successfully');
      }

    } catch (error) {
      if (isDev) console.error('Unexpected error sending message:', error);
      toast.error('An unexpected error occurred');
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      // Only clear processing if this is still the current request
      if (currentRequestId.current === requestId) {
        setIsProcessing(false);
        isThinkingRef.current = false;
      }
    }
  };

  return {
    sendMessage,
  };
};