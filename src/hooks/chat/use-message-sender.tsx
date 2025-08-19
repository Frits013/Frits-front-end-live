import { useRef } from "react";
import { ChatMessage, InterviewPhase } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { INITIAL_MESSAGE } from "@/hooks/chat-sessions/use-session-creation";
import { useSessionValidation } from "./use-session-validation";

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
  const { validateSession } = useSessionValidation();

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

  const executeWithRetry = async <T,>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = 2
  ): Promise<T | null> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Validate session before each attempt
        const session = await validateSession();
        if (!session) {
          throw new Error('Authentication required');
        }

        return await operation();
      } catch (error: any) {
        if (isDev) console.error(`${operationName} attempt ${attempt + 1} failed:`, error);
        
        // Check if it's an auth-related error
        const isAuthError = error?.message?.includes('JWT') || 
                           error?.message?.includes('auth') ||
                           error?.message?.includes('Authentication') ||
                           error?.code === 'PGRST301' ||
                           error?.code === 'PGRST302';

        if (isAuthError && attempt < maxRetries) {
          if (isDev) console.log(`Auth error detected, refreshing session and retrying...`);
          
          // Attempt to refresh the session
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            if (isDev) console.error('Session refresh failed:', refreshError);
            toast.error('Session expired. Please log in again.');
            // Could redirect to login here if needed
            return null;
          }
          
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        // If it's the last attempt or not an auth error, throw
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }
    return null;
  };

  const sendMessage = async (inputMessage: string) => {
    // Helper function to clear processing state
    const clearProcessingState = () => {
      setIsProcessing(false);
      isThinkingRef.current = false;
    };

    if (!inputMessage.trim() || !currentChatId) {
      if (isDev) console.warn('Cannot send message: empty message or no chat ID');
      return;
    }

    // Validate authentication first
    const session = await validateSession();
    if (!session) {
      return; // validateSession already shows error toast
    }

    // Generate unique request ID to prevent duplicates
    const requestId = Math.random().toString(36).substring(7);
    currentRequestId.current = requestId;

    setIsProcessing(true);
    setErrorMessage(null);
    isThinkingRef.current = true;

    // Fail-safe timeout to prevent stuck processing state
    const timeoutId = setTimeout(() => {
      if (currentRequestId.current === requestId) {
        if (isDev) console.warn('Message processing timeout, clearing state');
        clearProcessingState();
        toast.error('Request timeout. Please try again.');
      }
    }, 30000); // 30 second timeout

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

      // Save user message to database with retry logic
      const savedUserMessage = await executeWithRetry(
        async () => {
          const { data, error } = await supabase
            .from('chat_messages')
            .insert({
              session_id: currentChatId,
              content: inputMessage,
              role: 'user',
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        },
        'Save user message'
      );

      if (!savedUserMessage) {
        clearTimeout(timeoutId);
        clearProcessingState();
        toast.error('Failed to save your message. Please check your connection and try again.');
        return;
      }

      // Prepare the message with phase context
      let messageToSend = inputMessage;
      if (currentPhase) {
        const phaseContext = getPhaseContextMessage(inputMessage, currentPhase);
        messageToSend = `${phaseContext}\n\nUser's answer: ${inputMessage}`;
      }

      // Call the chat function with phase context and retry logic
      const chatResponse = await executeWithRetry(
        async () => {
          const { data, error } = await supabase.functions.invoke('chat', {
            body: {
              message: messageToSend,
              session_id: currentChatId,
            },
          });

          if (error) throw error;
          return data;
        },
        'Chat function invocation'
      );

      // Check if this is still the current request
      if (currentRequestId.current !== requestId) {
        if (isDev) console.log('Request superseded, ignoring response');
        clearTimeout(timeoutId);
        clearProcessingState();
        return;
      }

      if (!chatResponse) {
        clearTimeout(timeoutId);
        clearProcessingState();
        toast.error('Failed to get response from AI. Please try again.');
        setErrorMessage('Failed to get AI response. Please try again.');
        return;
      }

      if (chatResponse?.error) {
        if (isDev) console.error('Chat function returned error:', chatResponse.error);
        clearTimeout(timeoutId);
        clearProcessingState();
        toast.error('AI returned an error');
        setErrorMessage(chatResponse.error);
        return;
      }

      if (!chatResponse?.response) {
        if (isDev) console.error('No response from chat function');
        clearTimeout(timeoutId);
        clearProcessingState();
        toast.error('No response received');
        setErrorMessage('No response received from AI');
        return;
      }

      // Retrieve the assistant's response from the database with retry logic
      const assistantMessages = await executeWithRetry(
        async () => {
          const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', currentChatId)
            .eq('role', 'writer') // Look for 'writer' role, not 'assistant'
            .order('created_at', { ascending: false })
            .limit(1);

          if (error) throw error;
          return data;
        },
        'Fetch assistant message'
      );

      if (!assistantMessages) {
        clearTimeout(timeoutId);
        clearProcessingState();
        toast.error('Failed to retrieve AI response. Please try again.');
        return;
      }

      if (assistantMessages && assistantMessages.length > 0) {
        const latestAssistantMessage = assistantMessages[0];
        
        // Update messages with the real assistant message
        const allMessages = await executeWithRetry(
          async () => {
            const { data, error } = await supabase
              .from('chat_messages')
              .select('*')
              .eq('session_id', currentChatId)
              .order('created_at', { ascending: true });

            if (error) throw error;
            return data;
          },
          'Fetch all messages'
        );

        if (allMessages) {
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
      console.error('FULL ERROR DETAILS:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('Error type:', typeof error);
      console.error('Request ID when error occurred:', requestId);
      console.error('Current chat ID:', currentChatId);
      
      if (isDev) console.error('Unexpected error sending message:', error);
      toast.error('An unexpected error occurred');
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      clearTimeout(timeoutId);
      // Only clear processing if this is still the current request
      if (currentRequestId.current === requestId) {
        clearProcessingState();
      }
    }
  };

  return {
    sendMessage,
  };
};