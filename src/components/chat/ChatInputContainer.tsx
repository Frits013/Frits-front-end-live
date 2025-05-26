
import { useState } from "react";
import ChatInput from "./ChatInput";
import { ChatMessage } from "@/types/chat";
import { useMessageSender } from "@/hooks/chat/use-message-sender";

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
  const [inputMessage, setInputMessage] = useState("");
  
  const { sendMessage } = useMessageSender({
    messages,
    setMessages,
    currentChatId,
    setErrorMessage,
    setIsProcessing,
    isThinkingRef,
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(inputMessage);
    setInputMessage("");
  };

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
