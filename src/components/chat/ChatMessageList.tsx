
import { ChatMessage } from "@/types/chat";
import ChatMessages from "./ChatMessages";
import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessageListProps {
  messages: ChatMessage[];
}

const ChatMessageList = ({ messages }: ChatMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const prevMessagesLength = useRef(messages.length);

  // Only scroll to bottom when new messages arrive and user hasn't scrolled up
  useEffect(() => {
    // Check if new messages were added
    const newMessagesAdded = messages.length > prevMessagesLength.current;
    prevMessagesLength.current = messages.length;
    
    // Only auto-scroll if there are new messages and user hasn't manually scrolled up
    if (newMessagesAdded && !userScrolled) {
      scrollToBottom();
    }
  }, [messages, userScrolled]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const isScrolledUp = element.scrollHeight - element.scrollTop - element.clientHeight > 100;
    
    // Update userScrolled state based on scroll position
    if (isScrolledUp) {
      setUserScrolled(true);
    } else {
      // Reset userScrolled when user scrolls back to bottom
      setUserScrolled(false);
    }
  };

  return (
    <ScrollArea 
      className="flex-1 h-full w-full pt-4"
      onScroll={handleScroll}
      ref={scrollAreaRef}
    >
      <div className="px-4 pb-6 pt-2">
        <ChatMessages messages={messages} />
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default ChatMessageList;
