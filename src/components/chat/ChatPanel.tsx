
import { ResizablePanel } from "@/components/ui/resizable";
import { ChatMessage } from "@/types/chat";
import ChatMessagesContainer from "./ChatMessagesContainer";
import ChatInputContainer from "./ChatInputContainer";
import FinishInterviewButton from "./FinishInterviewButton";
import { useRef } from "react";

interface ChatPanelProps {
  defaultSize: number;
  minSize: number;
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  currentChatId: string | null;
  setErrorMessage: (error: string | null) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  isThinkingRef: React.MutableRefObject<boolean>;
  errorMessage: string | null;
  showCompleteButton: boolean;
  onCompleteButtonClick: () => void;
}

const ChatPanel = ({
  defaultSize,
  minSize,
  messages,
  setMessages,
  currentChatId,
  setErrorMessage,
  isProcessing,
  setIsProcessing,
  isThinkingRef,
  errorMessage,
  showCompleteButton,
  onCompleteButtonClick
}: ChatPanelProps) => {
  const inputContainerRef = useRef<HTMLDivElement>(null);

  return (
    <ResizablePanel defaultSize={defaultSize} minSize={minSize}>
      <div className="h-full flex flex-col overflow-hidden rounded-b-3xl bg-gradient-to-br from-white/95 via-white/85 to-purple-50/30 dark:from-gray-900/95 dark:via-gray-900/85 dark:to-purple-900/30 backdrop-blur-xl">
        
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-b-3xl shadow-inner pointer-events-none"></div>
        
        {/* Messages area - takes up remaining space */}
        <div className="flex-1 overflow-hidden relative z-10">
          <ChatMessagesContainer 
            messages={messages} 
            errorMessage={errorMessage}
            currentSessionId={currentChatId}
            showFinishButton={showCompleteButton}
            isProcessing={isProcessing}
          />
        </div>
        
        {/* Complete button */}
        <FinishInterviewButton 
          show={showCompleteButton}
          onFinish={onCompleteButtonClick}
        />
        
        {/* Input area - fixed at bottom */}
        <div 
          ref={inputContainerRef} 
          className="shrink-0 z-10"
        >
          <ChatInputContainer
            messages={messages}
            setMessages={setMessages}
            currentChatId={currentChatId}
            setErrorMessage={setErrorMessage}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            isThinkingRef={isThinkingRef}
          />
        </div>
      </div>
    </ResizablePanel>
  );
};

export default ChatPanel;
