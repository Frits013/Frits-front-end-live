
import { useState } from "react";
import { ChatMessage } from "@/types/chat";
import { useMessageFetcher } from "./chat/use-message-fetcher";
import { useProcessingState } from "./chat/use-processing-state";
import { useSessionSubscription } from "./chat/use-session-subscription";
import { useMessageSubscription } from "./chat/use-message-subscription";

export const useChatMessages = (sessionId: string | null) => {
  const [dialogDismissed, setDialogDismissed] = useState(false);
  
  // Use our custom hooks to manage chat state
  const {
    messages,
    setMessages,
    isConsultComplete,
    setIsConsultComplete,
    hasFeedback,
    setHasFeedback,
    autoMessageSent
  } = useMessageFetcher(sessionId);
  
  const { isProcessing, setIsProcessing } = useProcessingState(sessionId, autoMessageSent);
  
  // Set up subscription to session changes
  useSessionSubscription(
    sessionId,
    isConsultComplete,
    setIsConsultComplete,
    setDialogDismissed,
    setHasFeedback
  );
  
  // Set up subscription to message changes
  useMessageSubscription(sessionId, messages, setMessages, setIsProcessing);

  return {
    messages,
    setMessages,
    isConsultComplete,
    setIsConsultComplete,
    dialogDismissed,
    setDialogDismissed,
    hasFeedback,
    autoMessageSent,
    isProcessing,
    setIsProcessing
  };
};
