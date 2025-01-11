import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import ThreeScene from "@/components/chat/ThreeScene";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const isThinkingRef = useRef(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage("");

    isThinkingRef.current = true;

    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "This is a placeholder response. Connect your backend to get real responses from Frits.",
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentResponse]);
      isThinkingRef.current = false;
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <ThreeScene isThinking={isThinkingRef.current} />
        
        <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-purple-100 dark:border-purple-900 shadow-lg rounded-xl">
          <ChatMessages messages={messages} />
          <ChatInput
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            handleSendMessage={handleSendMessage}
          />
        </Card>
      </div>
    </div>
  );
};

export default Chat;