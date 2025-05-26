
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    
    // Prevent empty messages or duplicate submissions
    if (!inputMessage.trim() || isSubmitting || isProcessing) {
      return;
    }

    // Set submitting state immediately to prevent duplicate submissions
    setIsSubmitting(true);
    
    try {
      // Clear input immediately for better UX
      const messageToSend = inputMessage.trim();
      setInputMessage("");
      
      await sendMessage(messageToSend);
    } catch (error) {
      // Restore message if sending failed
      setInputMessage(inputMessage);
      console.error('Failed to send message:', error);
    } finally {
      // Reset submitting state
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 mt-auto">
      <ChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        isProcessing={isProcessing || isSubmitting}
      />
    </div>
  );
};

export default ChatInputContainer;
