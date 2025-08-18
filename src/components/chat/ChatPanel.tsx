

import { ChatMessage, InterviewPhase } from "@/types/chat";
import ChatMessagesContainer from "./ChatMessagesContainer";
import ChatInputContainer from "./ChatInputContainer";
import InterviewModeSwitcher from "./InterviewModeSwitcher";
import FinishInterviewButton from "./FinishInterviewButton";
import { useRef, useState } from "react";
import { useMessageSender } from "@/hooks/chat/use-message-sender";

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
    questionCount: number;
    maxQuestions: number;
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
  
  // Message sender hook for interview mode
  const { sendMessage } = useMessageSender({
    messages,
    setMessages,
    currentChatId,
    setErrorMessage,
    setIsProcessing,
    isThinkingRef,
  });

  // Calculate current question number for interview mode
  const assistantMessages = messages.filter(msg => msg.role === 'assistant');
  const currentQuestionNumber = assistantMessages.length;
  const maxQuestionsInPhase = demoPhaseData?.maxQuestions || 3;

  return (
    <div className="h-full flex flex-col">
      {useInterviewMode ? (
        // New Interview Mode - Centered UI
        <div className="flex-1 relative">
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
          
          {/* Complete button overlay */}
          <FinishInterviewButton 
            show={showCompleteButton}
            onFinish={onCompleteButtonClick}
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
