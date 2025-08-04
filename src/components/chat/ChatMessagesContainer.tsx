
import { ChatMessage, InterviewPhase } from "@/types/chat";
import InterviewMessages from "./InterviewMessages";
import ChatErrorAlert from "./ChatErrorAlert";

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
    questionCount: number;
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
  return (
    <div className="relative z-10 flex flex-col h-full">
      <ChatErrorAlert errorMessage={errorMessage} />
      <div className="flex-1 overflow-y-auto pb-32">
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
