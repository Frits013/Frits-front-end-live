
import { ChatMessage } from "@/types/chat";
import ChatMessageList from "./ChatMessageList";
import ChatErrorAlert from "./ChatErrorAlert";

interface ChatMessagesContainerProps {
  messages: ChatMessage[];
  errorMessage: string | null;
  currentSessionId: string | null;
  showFinishButton?: boolean;
}

const ChatMessagesContainer = ({ messages, errorMessage, currentSessionId, showFinishButton = false }: ChatMessagesContainerProps) => {
  return (
    <div className="relative z-10 flex flex-col h-full">
      <ChatErrorAlert errorMessage={errorMessage} />
      <ChatMessageList messages={messages} currentSessionId={currentSessionId} showFinishButton={showFinishButton} />
    </div>
  );
};

export default ChatMessagesContainer;
