
import { ChatMessage } from "@/types/chat";
import ChatMessageList from "./ChatMessageList";
import ChatErrorAlert from "./ChatErrorAlert";

interface ChatMessagesContainerProps {
  messages: ChatMessage[];
  errorMessage: string | null;
}

const ChatMessagesContainer = ({ messages, errorMessage }: ChatMessagesContainerProps) => {
  return (
    <div className="relative z-10 flex flex-col h-full">
      <ChatErrorAlert errorMessage={errorMessage} />
      <ChatMessageList messages={messages} />
    </div>
  );
};

export default ChatMessagesContainer;
