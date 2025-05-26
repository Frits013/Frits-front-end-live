
import { useState, useRef, useCallback, useEffect } from "react";
import { ChatMessage } from "@/types/chat";
import ConsultCompleteDialog from "@/components/chat/ConsultCompleteDialog";
import { useToast } from "@/hooks/use-toast";
import ChatPanelLayout from "./ChatPanelLayout";
import ChatVisualizerPanel from "./ChatVisualizerPanel";
import ChatPanel from "./ChatPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResizableHandle } from "@/components/ui/resizable";

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

  // Update default size when mobile status changes
  useEffect(() => {
    setDefaultVisualizerSize(isMobile ? 25 : 35);
  }, [isMobile]);

  // Update the button visibility when isConsultComplete changes
  useEffect(() => {
    // Show the button when the session is completed but dialog is not showing
    // and there's no feedback yet and dialog hasn't been dismissed
    if (isConsultComplete && !showCompleteDialog && !hasFeedback && !dialogDismissed) {
      setShowCompleteButton(true);
    } else {
      setShowCompleteButton(false);
    }
  }, [isConsultComplete, showCompleteDialog, hasFeedback, dialogDismissed]);

  // Replace the auto-showing dialog effect with button-triggered approach
  const handleCompleteButtonClick = useCallback(() => {
    if (currentChatId) {
      setShowCompleteDialog(true);
      setShowCompleteButton(false); // Hide the button when dialog is shown
    }
  }, [currentChatId]);

  const handleFinishConsult = () => {
    if (currentChatId) {
      // Call onConsultFinish only when the user confirms by clicking "End Session"
      onConsultFinish(currentChatId);
      toast({
        title: "Success",
        description: "Consult session marked as complete",
      });
    }
    setShowCompleteDialog(false);
    setDialogDismissed(true);
  };

  const handleContinueChat = () => {
    setShowCompleteDialog(false);
    setDialogDismissed(true);
  };

  return (
    <>
      <ChatPanelLayout>
        <ChatVisualizerPanel
          defaultSize={defaultVisualizerSize}
          minSize={isMobile ? 15 : 20}
          isThinking={isThinkingRef.current}
          audioData={audioData}
          currentSessionId={currentChatId}
        />
        
        <ResizableHandle 
          withHandle={true}
          className="relative group h-4 cursor-row-resize bg-gradient-to-r from-purple-200/80 via-indigo-200/80 to-purple-200/80 dark:from-purple-700/60 dark:via-indigo-700/60 dark:to-purple-700/60 hover:from-purple-300/90 hover:via-indigo-300/90 hover:to-purple-300/90 dark:hover:from-purple-600/70 dark:hover:via-indigo-600/70 dark:hover:to-purple-600/70 transition-all duration-300"
        />
        
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
