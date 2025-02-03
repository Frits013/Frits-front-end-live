import { Message } from "@/types/chat";
import ChatMessages from "./ChatMessages";

interface ChatMessageListProps {
  messages: Message[];
}

const ChatMessageList = ({ messages }: ChatMessageListProps) => {
  return (
    <div className="flex-1 overflow-y-auto">
      <ChatMessages messages={messages} />
    </div>
  );
};

export default ChatMessageList;