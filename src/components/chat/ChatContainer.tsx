
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

  // Update the button visibility when relevant states change
  useEffect(() => {
    console.log('Button visibility check:', {
      isConsultComplete,
      showCompleteDialog,
      hasFeedback,
      dialogDismissed
    });
    
    // Show the button when:
    // 1. Session is marked as complete in database (isConsultComplete)
    // 2. Dialog is not currently showing
    // 3. No feedback exists yet
    // 4. Dialog hasn't been manually dismissed
    const shouldShowButton = isConsultComplete && 
                            !showCompleteDialog && 
                            !hasFeedback && 
                            !dialogDismissed;
    
    console.log('Should show complete button:', shouldShowButton);
    setShowCompleteButton(shouldShowButton);
  }, [isConsultComplete, showCompleteDialog, hasFeedback, dialogDismissed]);

  // Show dialog immediately when session is marked complete
  useEffect(() => {
    if (isConsultComplete && !hasFeedback && !dialogDismissed) {
      console.log('Session marked complete, showing dialog');
      setShowCompleteDialog(true);
      setShowCompleteButton(false);
    }
  }, [isConsultComplete, hasFeedback, dialogDismissed]);

  // Handle when user clicks the finish interview button
  const handleCompleteButtonClick = useCallback(() => {
    console.log('Complete button clicked');
    if (currentChatId) {
      setShowCompleteDialog(true);
      setShowCompleteButton(false); // Hide the button when dialog is shown
    }
  }, [currentChatId]);

  // Handle when user confirms finishing the session via the dialog
  const handleFinishConsult = () => {
    console.log('Finishing consult session - actually marking as finished in database');
    if (currentChatId) {
      // NOW we mark the session as finished in the database
      onConsultFinish(currentChatId);
      toast({
        title: "Success",
        description: "Consult session completed successfully",
      });
    }
    setShowCompleteDialog(false);
    setDialogDismissed(true);
  };

  // Handle when user chooses to continue chatting (closes dialog without ending)
  const handleContinueChat = () => {
    console.log('User closed dialog without ending session - session stays active');
    setShowCompleteDialog(false);
    setDialogDismissed(true);
    // Note: We do NOT call onConsultFinish here - session stays active
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
