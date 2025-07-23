
import { useState, useRef, useCallback, useEffect } from "react";
import { ChatMessage } from "@/types/chat";
import ConsultCompleteDialog from "@/components/chat/ConsultCompleteDialog";
import { useToast } from "@/hooks/use-toast";
import ChatPanelLayout from "./ChatPanelLayout";
import ChatVisualizerPanel from "./ChatVisualizerPanel";
import ChatPanel from "./ChatPanel";
import { useIsMobile } from "@/hooks/use-mobile";

import { useSessionAnimations } from "@/hooks/chat/use-session-animations";

interface ChatContainerProps {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  currentChatId: string | null;
  updateChatTitle: (chatId: string, newTitle: string) => Promise<boolean>;
  isConsultComplete: boolean;
  setIsConsultComplete: (isComplete: boolean) => void;
  onConsultFinish: (sessionId: string) => void;
  dialogDismissed: boolean;
  setDialogDismissed: (dismissed: boolean) => void;
  hasFeedback?: boolean;
  onSessionAnimation?: (shouldAnimate: boolean, sessionId?: string) => void;
}

const ChatContainer = ({
  messages,
  setMessages,
  currentChatId,
  updateChatTitle,
  isConsultComplete,
  setIsConsultComplete,
  onConsultFinish,
  dialogDismissed,
  setDialogDismissed,
  hasFeedback = false,
  onSessionAnimation,
}: ChatContainerProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const isThinkingRef = useRef(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const isMobile = useIsMobile();
  
  // Add a new state to track whether the complete button is showing
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  
  // Track the default size of the visualizer panel - smaller on mobile
  const [defaultVisualizerSize, setDefaultVisualizerSize] = useState(isMobile ? 25 : 35);

  // Use the session animations hook
  const { shouldTriggerAnimation, startSessionAnimation } = useSessionAnimations(showCompleteButton);

  // Update default size when mobile status changes
  useEffect(() => {
    setDefaultVisualizerSize(isMobile ? 25 : 35);
  }, [isMobile]);

  // Button visibility logic - show when session is marked as finished in database but not yet completed by user
  useEffect(() => {
    console.log('Button visibility check:', {
      isConsultComplete,
      hasFeedback,
      dialogDismissed
    });
    
    // Show the button when:
    // 1. Session is marked as finished in database (isConsultComplete)
    // 2. User hasn't completed the process yet (no feedback exists)
    const shouldShowButton = isConsultComplete && !hasFeedback;
    
    console.log('Should show complete button:', shouldShowButton);
    setShowCompleteButton(shouldShowButton);
  }, [isConsultComplete, hasFeedback]);

  // Trigger session animation when button appears
  useEffect(() => {
    if (shouldTriggerAnimation && currentChatId && onSessionAnimation) {
      console.log('Triggering session animation for:', currentChatId);
      onSessionAnimation(true, currentChatId);
      startSessionAnimation(currentChatId);
    }
  }, [shouldTriggerAnimation, currentChatId, onSessionAnimation, startSessionAnimation]);

  // Handle when user clicks the finish interview button
  const handleCompleteButtonClick = useCallback(() => {
    console.log('Complete button clicked - showing dialog');
    if (currentChatId) {
      setShowCompleteDialog(true);
    }
  }, [currentChatId]);

  // Handle when user confirms finishing the session via the dialog
  const handleFinishConsult = () => {
    console.log('User confirmed finishing consult session');
    if (currentChatId) {
      // Mark the session as finished by the user (this will move it to completed section)
      onConsultFinish(currentChatId);
      toast({
        title: "Success",
        description: "Consult session completed successfully",
      });
    }
    setShowCompleteDialog(false);
  };

  // Handle when user chooses to continue chatting (closes dialog without ending)
  const handleContinueChat = () => {
    console.log('User closed dialog without ending session - session stays active');
    setShowCompleteDialog(false);
    // Note: We do NOT call onConsultFinish here - session stays active
  };

  return (
    <>
      <ChatPanelLayout>
        <div className="flex flex-col h-full">
          <div className={`${isMobile ? 'h-1/4' : 'h-1/3'} flex-shrink-0`}>
            <ChatVisualizerPanel
              defaultSize={defaultVisualizerSize}
              minSize={isMobile ? 15 : 20}
              isThinking={isProcessing && isThinkingRef.current}
              audioData={audioData}
              currentSessionId={currentChatId}
            />
          </div>
          
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              defaultSize={100 - defaultVisualizerSize}
              minSize={isMobile ? 40 : 30}
              messages={messages}
              setMessages={setMessages}
              currentChatId={currentChatId}
              setErrorMessage={setErrorMessage}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              isThinkingRef={isThinkingRef}
              errorMessage={errorMessage}
              showCompleteButton={showCompleteButton}
              onCompleteButtonClick={handleCompleteButtonClick}
            />
          </div>
        </div>
      </ChatPanelLayout>

      <ConsultCompleteDialog
        open={showCompleteDialog}
        onClose={handleContinueChat}
        onFinish={handleFinishConsult}
        sessionId={currentChatId}
      />
    </>
  );
};

export default ChatContainer;
