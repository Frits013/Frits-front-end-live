
import ChatInput from "./ChatInput";
import { ChatMessage } from "@/types/chat";
import { useSendMessage } from "@/hooks/use-send-message";

interface ChatInputContainerProps {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  currentChatId: string | null;
  setErrorMessage: (error: string | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  isProcessing: boolean;
  isThinkingRef: React.MutableRefObject<boolean>;
}

const ChatInputContainer = ({
  messages,
  setMessages,
  currentChatId,
  setErrorMessage,
  setIsProcessing,
  isProcessing,
  isThinkingRef,
}: ChatInputContainerProps) => {
  const { inputMessage, setInputMessage, handleSendMessage } = useSendMessage({
    messages,
    setMessages,
    currentChatId,
    setErrorMessage,
    setIsProcessing,
    isThinkingRef,
  });

  return (
    <div className="p-4 mt-auto">
      <ChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default ChatInputContainer;
