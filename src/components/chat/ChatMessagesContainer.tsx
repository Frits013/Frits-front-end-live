
import { ChatMessage } from "@/types/chat";
import InterviewMessages from "./InterviewMessages";
import ChatErrorAlert from "./ChatErrorAlert";

interface ChatMessagesContainerProps {
  messages: ChatMessage[];
  errorMessage: string | null;
  currentSessionId: string | null;
  showFinishButton?: boolean;
  isProcessing?: boolean;
}

const ChatMessagesContainer = ({ 
  messages, 
  errorMessage, 
  currentSessionId, 
  showFinishButton = false,
  isProcessing = false 
}: ChatMessagesContainerProps) => {
  return (
    <div className="relative z-10 flex flex-col h-full">
      <ChatErrorAlert errorMessage={errorMessage} />
      <div className="flex-1 overflow-y-auto pb-32">
        <InterviewMessages 
          messages={messages} 
          showFinishButton={showFinishButton} 
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
};

export default ChatMessagesContainer;
