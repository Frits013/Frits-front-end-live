import { ChatMessage } from "@/types/chat";
import ChatMessages from "./ChatMessages";
import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProcessingState } from "@/hooks/chat/use-processing-state";

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentSessionId: string | null;
  showFinishButton?: boolean;
}

const ChatMessageList = ({
  messages,
  currentSessionId,
  showFinishButton = false
}: ChatMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const prevMessagesLength = useRef(messages.length);
  const chatSessionId = useRef<string | null>(null);
  const isMobile = useIsMobile();
  const {
    isProcessing
  } = useProcessingState(currentSessionId);

  // Only scroll to bottom when new messages arrive and user hasn't scrolled up
  useEffect(() => {
    // Check if new messages were added
    const newMessagesAdded = messages.length > prevMessagesLength.current;

    // Get the current chat session ID from the first message
    const currentSessionIdFromMessages = messages.length > 0 ? messages[0].id.split('-')[0] : null;

    // If we switched to a different chat, reset userScrolled state
    if (currentSessionIdFromMessages !== chatSessionId.current) {
      setUserScrolled(false);
      chatSessionId.current = currentSessionIdFromMessages;
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
    messagesEndRef.current?.scrollIntoView({
      behavior: isMobile ? "auto" : "smooth"
    });
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
    <ScrollArea className="flex-1 h-full w-full overflow-y-auto" onScroll={handleScroll} ref={scrollAreaRef}>
      <div className="min-h-full flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Frits is preparing your consultation...</h3>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <ChatMessages messages={messages} showFinishButton={showFinishButton} />
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default ChatMessageList;
