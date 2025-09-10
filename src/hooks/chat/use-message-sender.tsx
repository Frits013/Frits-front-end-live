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

  const getPhaseContextMessage = (userAnswer: string, nextPhase: InterviewPhase): string => {
    // Special hardcoded prompts for summary and recommendations phases
    if (nextPhase === 'summary') {
      return "YOU ARE NOW IN THE SUMMARY PHASE I WANT YOU TO WRITE A SUMMARY FOR THE USER ABOUT THE AI READINESS CONVERSATION YOU JUST HAD WITH INTERESTING FINDINGS AND TOPICS YOU THOUGHT WERE UNIQUE/INTERESTING.";
    }
    
    if (nextPhase === 'recommendations') {
      return "PROVIDE ACTIONABLE RECOMMENDATIONS BASED ON THE CONVERSATION...";
    }
    
    // Standard phase context for other phases
    return `The next question you will ask will be from the ${nextPhase} phase. You are in that part of the interview process KEEP THIS INTO ACCOUNT. "This was the user's last answer: ${userAnswer}."`;
  };

  const predictNextPhase = (currentPhase: InterviewPhase, messages: ChatMessage[]): InterviewPhase => {
    const phaseDefinitions = {
      'introduction': { maxQuestions: 3, order: 0 },
      'theme_selection': { maxQuestions: 4, order: 1 },
      'deep_dive': { maxQuestions: 10, order: 2 },
      'summary': { maxQuestions: 3, order: 3 },
      'recommendations': { maxQuestions: 2, order: 4 }
    };

    // Count only regular user messages (not enhanced ones)
    const regularUserMessages = messages.filter(msg => 
      msg.role === 'user' && 
      !msg.content.includes('YOU ARE NOW IN THE') && 
      !msg.content.includes('The next question you will ask will be from the')
    );
    
    // Count assistant messages
    const assistantMessages = messages.filter(msg => msg.role === 'assistant' || msg.role === 'writer');
    
    // Calculate how many questions have been asked in each phase
    let questionCount = 0;
    const phases = Object.keys(phaseDefinitions) as InterviewPhase[];
    
    for (const phase of phases) {
      const maxQuestions = phaseDefinitions[phase].maxQuestions;
      
      if (phase === currentPhase) {
        // For current phase, check if we're about to complete it
        const questionsInCurrentPhase = Math.min(assistantMessages.length - questionCount, maxQuestions);
        const userAnswersInCurrentPhase = Math.min(regularUserMessages.length - questionCount, maxQuestions);
        
        // If user is about to answer the last question of this phase, return next phase
        if (userAnswersInCurrentPhase >= maxQuestions - 1 && questionsInCurrentPhase >= maxQuestions - 1) {
          const currentPhaseIndex = phases.indexOf(currentPhase);
          if (currentPhaseIndex < phases.length - 1) {
            return phases[currentPhaseIndex + 1];
          }
        }
        break;
      }
      
      questionCount += maxQuestions;
    }
    
    return currentPhase;
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

    // Extended timeout for backend processing (2 minutes)
    const timeoutId = setTimeout(() => {
      if (currentRequestId.current === requestId) {
        if (isDev) console.warn('Message processing timeout, clearing state');
        clearProcessingState();
        toast.error('Processing is taking longer than expected. Please try again.');
      }
    }, 120000); // 2 minute timeout to accommodate backend processing time

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
              user_id: session.user.id,
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

      // Save phase context as a separate system message if we have a current phase
      if (currentPhase) {
        const nextPhase = predictNextPhase(currentPhase, messages);
        const phaseContext = getPhaseContextMessage(inputMessage, nextPhase);
        
        await executeWithRetry(
          async () => {
            const { error } = await supabase
              .from('chat_messages')
              .insert({
                session_id: currentChatId,
                content: phaseContext,
                role: 'system',
                user_id: session.user.id,
              });

            if (error) throw error;
            return true;
          },
          'Save system message'
        );
      }

      // Call the chat function with original user message (no phase context)
      // NO RETRY LOGIC - send once and wait for response
      console.log('About to call chat function with:', {
        message: inputMessage,
        session_id: currentChatId
      });
      
      const { data: chatResponse, error: chatError } = await supabase.functions.invoke('chat', {
        body: {
          message: inputMessage,
          session_id: currentChatId,
        },
      });

      console.log('Chat function response:', { data: chatResponse, error: chatError });
      
      if (chatError) {
        console.error('Chat function error details:', chatError);
        clearTimeout(timeoutId);
        clearProcessingState();
        toast.error('Failed to send message to AI. Please try again.');
        setErrorMessage(chatError.message || 'Failed to send message');
        return;
      }

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
              
              // Exclude system messages (they are internal phase prompts)
              if (msg.role === 'system') {
                return false;
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