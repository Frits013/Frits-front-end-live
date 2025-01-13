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
  const [isProcessing, setIsProcessing] = useState(false);
  const isThinkingRef = useRef(false);
  const [audioData, setAudioData] = useState<number[]>([]);

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
    setIsProcessing(true);
    isThinkingRef.current = true;

    // Simulate API response with audio data
    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "This is a placeholder response. Connect your backend to get real responses.",
        sender: 'agent',
        timestamp: new Date(),
      };
      
      // Simulate audio data (replace with actual API response)
      const simulatedAudioData = Array.from({ length: 32 }, () => Math.random() * 0.5);
      setAudioData(simulatedAudioData);
      
      setMessages(prev => [...prev, agentResponse]);
      setIsProcessing(false);
      isThinkingRef.current = false;

      // Clear audio data after a delay
      setTimeout(() => setAudioData([]), 3000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.2),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.2),rgba(255,255,255,0))]" />
      
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <div className="w-full max-w-[500px] mx-auto">
          <ThreeScene isThinking={isThinkingRef.current} audioData={audioData} />
        </div>
        
        <Card className="p-6 bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border-purple-100/50 dark:border-purple-900/50 shadow-xl rounded-xl relative overflow-hidden">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-purple-50/30 dark:from-gray-800/50 dark:to-purple-900/30 pointer-events-none" />
          
          {/* Content */}
          <div className="relative z-10 space-y-6">
            <ChatMessages messages={messages} />
            <ChatInput
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              handleSendMessage={handleSendMessage}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;