
import { useState } from "react";
import { ChatMessage } from "@/types/chat";
import { useMessageFetcher } from "./chat/use-message-fetcher";
import { useProcessingState } from "./chat/use-processing-state";
import { useSessionSubscription } from "./chat/use-session-subscription";
import { useMessageSubscription } from "./chat/use-message-subscription";
import { usePhaseSubscription } from "./chat/use-phase-subscription";
import { useDemoPhaseManagement } from "./chat/use-demo-phase-management";
import { useNewSessionPolling } from "./chat/use-new-session-polling";

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
    autoMessageSent,
    sessionData,
    currentProgress,
    phaseConfigs
  } = useMessageFetcher(sessionId);
  
  const { isProcessing, setIsProcessing } = useProcessingState(sessionId);
  
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
  
  // Set up subscription to phase changes
  usePhaseSubscription(sessionId, 
    (data) => { /* sessionData is managed by useMessageFetcher */ }, 
    (progress) => { /* currentProgress is managed by useMessageFetcher */ }
  );

  // Demo phase management with client-side logic
  const demoPhaseData = useDemoPhaseManagement({
    sessionId,
    messages,
    sessionData
  });

  // Poll for new session messages when needed
  useNewSessionPolling({
    sessionId,
    messages,
    autoMessageSent,
    sessionData,
    onMessagesUpdate: setMessages
  });

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
    setIsProcessing,
    sessionData,
    currentProgress,
    phaseConfigs,
    demoPhaseData
  };
};
