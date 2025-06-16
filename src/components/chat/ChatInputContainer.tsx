
import { useState, useEffect } from "react";
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

  // Load saved input message from localStorage on component mount
  useEffect(() => {
    const savedMessage = localStorage.getItem('chat-input-draft');
    if (savedMessage) {
      setInputMessage(savedMessage);
    }
  }, []);

  // Save input message to localStorage whenever it changes
  const handleInputChange = (message: string) => {
    setInputMessage(message);
    if (message.trim()) {
      localStorage.setItem('chat-input-draft', message);
    } else {
      localStorage.removeItem('chat-input-draft');
    }
  };

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
      // Clear the saved draft since message is being sent
      localStorage.removeItem('chat-input-draft');
      
      await sendMessage(messageToSend);
    } catch (error) {
      // Restore message if sending failed
      setInputMessage(inputMessage);
      localStorage.setItem('chat-input-draft', inputMessage);
      console.error('Failed to send message:', error);
    } finally {
      // Reset submitting state
      setIsSubmitting(false);
    }
  };

  return (
    <ChatInput
      inputMessage={inputMessage}
      setInputMessage={handleInputChange}
      handleSendMessage={handleSendMessage}
      isProcessing={isProcessing || isSubmitting}
    />
  );
};

export default ChatInputContainer;
