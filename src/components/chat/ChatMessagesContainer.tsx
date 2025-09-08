
import { ChatMessage, InterviewPhase } from "@/types/chat";
import InterviewMessages from "./InterviewMessages";
import ChatErrorAlert from "./ChatErrorAlert";
import { useEffect, useRef, useState } from "react";

interface ChatMessagesContainerProps {
  messages: ChatMessage[];
  errorMessage: string | null;
  currentSessionId: string | null;
  showFinishButton?: boolean;
  isProcessing?: boolean;
  sessionData?: any;
  currentProgress?: any;
  demoPhaseData?: {
    currentPhase: InterviewPhase;
    answerCount: number;
    maxQuestions: number;
  };
}

const ChatMessagesContainer = ({ 
  messages, 
  errorMessage, 
  currentSessionId, 
  showFinishButton = false,
  isProcessing = false,
  sessionData,
  currentProgress,
  demoPhaseData
}: ChatMessagesContainerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);

  // Auto-scroll to bottom only when new messages arrive
  useEffect(() => {
    if (messages.length > previousMessageCount && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setPreviousMessageCount(messages.length);
    }
  }, [messages.length, previousMessageCount]);

  return (
    <div className="relative z-10 flex flex-col h-full">
      <ChatErrorAlert errorMessage={errorMessage} />
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-32">
        <InterviewMessages 
          messages={messages} 
          showFinishButton={showFinishButton} 
          isProcessing={isProcessing}
          sessionData={sessionData}
          currentProgress={currentProgress}
          demoPhaseData={demoPhaseData}
        />
      </div>
    </div>
  );
};

export default ChatMessagesContainer;
