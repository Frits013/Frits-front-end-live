
import { useState, useRef, useCallback, useEffect } from "react";
import InterviewProgress from "./InterviewProgress";
import { ChatMessage, ChatSession, InterviewProgress as InterviewProgressType } from "@/types/chat";
import ConsultCompleteDialog from "@/components/chat/ConsultCompleteDialog";
import { useToast } from "@/hooks/use-toast";
import ChatPanelLayout from "./ChatPanelLayout";

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
  sessionData?: ChatSession | null;
  currentProgress?: InterviewProgressType | null;
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
  sessionData,
  currentProgress
}: ChatContainerProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const isMobile = useIsMobile();
  
  // Add a new state to track whether the complete button is showing
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  const isThinkingRef = useRef(false);

  // Use the session animations hook
  const { shouldTriggerAnimation, startSessionAnimation } = useSessionAnimations(showCompleteButton);

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

  // Helper function to get max questions for a phase
  const getMaxQuestionsForPhase = (phase: string) => {
    const phaseMaxQuestions = {
      'introduction': 3,
      'theme_selection': 5,
      'deep_dive': 8,
      'summary': 3,
      'recommendations': 2
    };
    return phaseMaxQuestions[phase as keyof typeof phaseMaxQuestions] || 5;
  };

  // Calculate interview progress
  const userMessages = messages.filter(msg => msg.role === 'user');
  const totalQuestions = 21; // Total across all phases (3+5+8+3+2)
  const answeredQuestions = userMessages.length;
  
  // Get current phase from session data
  const currentPhase = sessionData?.current_phase;
  
  // Create phase info from current progress data
  const phaseInfo = currentProgress ? {
    current_phase: currentProgress.phase,
    progress_percent: 0, // Will be calculated in InterviewProgress component
    questions_in_phase: currentProgress.questions_asked,
    max_questions_in_phase: getMaxQuestionsForPhase(currentProgress.phase),
    should_transition: false, // We don't have this info directly
    selected_themes: Array.isArray(currentProgress.selected_themes) ? 
      currentProgress.selected_themes : 
      (currentProgress.selected_themes as any)?.themes || [],
    completion_confidence: currentProgress.completion_confidence || 0
  } : undefined;
  
  const estimatedTimeLeft = answeredQuestions < totalQuestions ? 
    `${Math.max(1, Math.ceil((totalQuestions - answeredQuestions) * 2))} min` : undefined;

  return (
    <>
      <ChatPanelLayout>
        <div className="flex flex-col h-full">
          {/* Interview Progress - positioned at the top */}
          {messages.length > 0 && (
            <div className="flex-shrink-0 px-4 py-2">
              <InterviewProgress
                currentPhase={currentPhase}
                phaseInfo={phaseInfo}
                totalQuestions={totalQuestions}
                answeredQuestions={answeredQuestions}
                estimatedTimeLeft={estimatedTimeLeft}
              />
            </div>
          )}
          
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatPanel
              defaultSize={100}
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
