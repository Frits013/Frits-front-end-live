
import { ChatMessage } from "@/types/chat";
import ChatMessages from "./ChatMessages";
import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessageListProps {
  messages: ChatMessage[];
}

const ChatMessageList = ({ messages }: ChatMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll when messages change

  return (
    <ScrollArea className="flex-1 h-full w-full pt-4">
      <div className="px-4 pb-6 pt-2">
        <ChatMessages messages={messages} />
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default ChatMessageList;
