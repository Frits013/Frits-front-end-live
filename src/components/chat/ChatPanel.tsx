

import { ChatMessage, InterviewPhase } from "@/types/chat";
import ChatMessagesContainer from "./ChatMessagesContainer";
import ChatInputContainer from "./ChatInputContainer";
import InterviewModeSwitcher from "./InterviewModeSwitcher";
import FinishInterviewButton from "./FinishInterviewButton";
import SummaryRecommendationsDisplay from "./SummaryRecommendationsDisplay";
import { useRef, useState } from "react";
import { useMessageSender } from "@/hooks/chat/use-message-sender";
import ConsultCompleteDialog from "./ConsultCompleteDialog";

interface ChatPanelProps {
  defaultSize: number;
  minSize: number;
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  currentChatId: string | null;
  setErrorMessage: (error: string | null) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  isThinkingRef: React.MutableRefObject<boolean>;
  errorMessage: string | null;
  showCompleteButton: boolean;
  onCompleteButtonClick: () => void;
  sessionData?: any;
  currentProgress?: any;
  demoPhaseData?: {
    currentPhase: InterviewPhase;
    answerCount: number;
    currentQuestionNumber: number;
    maxQuestions: number;
    triggerNextPhase?: () => void;
    canTriggerNextPhase?: boolean;
  };
}

const ChatPanel = ({
  defaultSize,
  minSize,
  messages,
  setMessages,
  currentChatId,
  setErrorMessage,
  isProcessing,
  setIsProcessing,
  isThinkingRef,
  errorMessage,
  showCompleteButton,
  onCompleteButtonClick,
  sessionData,
  currentProgress,
  demoPhaseData
}: ChatPanelProps) => {
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [useInterviewMode, setUseInterviewMode] = useState(true);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [isGettingRecommendations, setIsGettingRecommendations] = useState(false);
  
  // Message sender hook for interview mode
  const { sendMessage } = useMessageSender({
    messages,
    setMessages,
    currentChatId,
    setErrorMessage,
    setIsProcessing,
    isThinkingRef,
    currentPhase: demoPhaseData?.currentPhase,
  });

  // Manual trigger for feedback dialog
  const handleEndInterview = () => {
    console.log('User clicked End Interview - triggering feedback dialog');
    setShowFeedbackDialog(true);
  };

  // Use phase-specific question numbers from demoPhaseData
  const currentQuestionNumber = demoPhaseData?.currentQuestionNumber || 1;
  const maxQuestionsInPhase = demoPhaseData?.maxQuestions || 3;

  // Handle getting recommendations by showing feedback dialog first, then sending message
  const handleGetRecommendations = async () => {
    if (demoPhaseData?.currentPhase === 'summary' && !isGettingRecommendations) {
      // Show feedback dialog first
      setShowFeedbackDialog(true);
    }
  };

  // Handle feedback dialog close - send recommendations message after dialog closes
  const handleFeedbackDialogClose = async () => {
    setShowFeedbackDialog(false);
    
    // Now send the message to get recommendations
    if (demoPhaseData?.currentPhase === 'summary' && !isGettingRecommendations) {
      setIsGettingRecommendations(true);
      try {
        // Send a placeholder message to trigger the recommendations phase
        await sendMessage("Please provide my personalized recommendations.");
      } finally {
        // Reset loading state after a delay (message sending process will handle the phase transition)
        setTimeout(() => setIsGettingRecommendations(false), 2000);
      }
    }
  };

  // Check if we should show summary/recommendations display
  const showSummaryRecommendations = demoPhaseData?.currentPhase === 'summary' || demoPhaseData?.currentPhase === 'recommendations';

  return (
    <div className="h-full flex flex-col">
      {useInterviewMode ? (
        // New Interview Mode - Centered UI
        <div className="flex-1 relative">
          {showSummaryRecommendations ? (
            <SummaryRecommendationsDisplay
              messages={messages}
              currentPhase={demoPhaseData.currentPhase}
              onGetRecommendations={handleGetRecommendations}
              canTriggerRecommendations={demoPhaseData?.canTriggerNextPhase || false}
              isLoading={isGettingRecommendations}
              isProcessing={isProcessing}
              onEndInterview={handleEndInterview}
            />
          ) : (
            <InterviewModeSwitcher
              messages={messages}
              setMessages={setMessages}
              currentChatId={currentChatId}
              setErrorMessage={setErrorMessage}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              isThinkingRef={isThinkingRef}
              currentPhase={demoPhaseData?.currentPhase}
              questionNumber={currentQuestionNumber}
              maxQuestions={maxQuestionsInPhase}
              onSendMessage={sendMessage}
            />
          )}
          
          {/* Feedback dialog */}
          <ConsultCompleteDialog
            open={showFeedbackDialog}
            onClose={handleFeedbackDialogClose}
            onFinish={handleFeedbackDialogClose}
            sessionId={currentChatId}
          />
        </div>
      ) : (
        // Original Chat Mode - kept for fallback
        <div className="flex-1 flex flex-col overflow-hidden rounded-b-3xl bg-gradient-to-br from-white/95 via-white/85 to-purple-50/30 dark:from-gray-900/95 dark:via-gray-900/85 dark:to-purple-900/30 backdrop-blur-xl">
          
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-b-3xl shadow-inner pointer-events-none"></div>
          
          {/* Messages area - takes up remaining space */}
          <div className="flex-1 overflow-hidden relative z-10">
            <ChatMessagesContainer 
              messages={messages} 
              errorMessage={errorMessage}
              currentSessionId={currentChatId}
              showFinishButton={showCompleteButton}
              isProcessing={isProcessing}
              sessionData={sessionData}
              currentProgress={currentProgress}
              demoPhaseData={demoPhaseData}
            />
          </div>
          
          {/* Complete button */}
          <FinishInterviewButton 
            show={showCompleteButton}
            onFinish={onCompleteButtonClick}
          />
          
          {/* Input area - fixed at bottom */}
          <div 
            ref={inputContainerRef} 
            className="shrink-0 z-10"
          >
            <ChatInputContainer
              messages={messages}
              setMessages={setMessages}
              currentChatId={currentChatId}
              setErrorMessage={setErrorMessage}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              isThinkingRef={isThinkingRef}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
