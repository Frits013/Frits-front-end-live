
import { ChatMessage } from "@/types/chat";
import ChatMessages from "./ChatMessages";
import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatMessageListProps {
  messages: ChatMessage[];
}

const ChatMessageList = ({ messages }: ChatMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const prevMessagesLength = useRef(messages.length);
  const chatSessionId = useRef<string | null>(null);
  const isMobile = useIsMobile();

  // Only scroll to bottom when new messages arrive and user hasn't scrolled up
  useEffect(() => {
    // Check if new messages were added
    const newMessagesAdded = messages.length > prevMessagesLength.current;
    
    // Get the current chat session ID from the first message
    const currentSessionId = messages.length > 0 ? messages[0].id.split('-')[0] : null;
    
    // If we switched to a different chat, reset userScrolled state
    if (currentSessionId !== chatSessionId.current) {
      setUserScrolled(false);
      chatSessionId.current = currentSessionId;
      // Always scroll to bottom when switching chats
      scrollToBottom();
    } else if (newMessagesAdded && !userScrolled) {
      // Only auto-scroll if there are new messages in the same chat and user hasn't manually scrolled up
      scrollToBottom();
    }
    
    prevMessagesLength.current = messages.length;
  }, [messages]);

  // Handle visibility change (coming back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Reset scroll position when becoming visible again
        if (!userScrolled) {
          scrollToBottom();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userScrolled]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: isMobile ? "auto" : "smooth" });
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
      className="flex-1 h-full w-full pt-4 overflow-y-auto"
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
