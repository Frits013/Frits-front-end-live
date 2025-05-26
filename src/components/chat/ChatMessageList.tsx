
import { ChatMessage } from "@/types/chat";
import ChatMessages from "./ChatMessages";
import { useEffect, useRef } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);

  // Simple auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 h-full w-full overflow-y-auto overscroll-contain"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >
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
    </div>
  );
};

export default ChatMessageList;
