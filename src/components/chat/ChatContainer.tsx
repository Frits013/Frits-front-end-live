import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import ThreeScene from "@/components/chat/ThreeScene";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface ChatContainerProps {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  currentChatId: string | null;
  updateChatTitle: (chatId: string, newTitle: string) => Promise<boolean>;
}

const ChatContainer = ({
  messages,
  setMessages,
  currentChatId,
  updateChatTitle,
}: ChatContainerProps) => {
  const { toast } = useToast();
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const isThinkingRef = useRef(false);
  const [audioData, setAudioData] = useState<number[]>([]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentChatId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    // Save message to database
    const { error: messageError } = await supabase
      .from('messages')
      .insert([{
        chat_id: currentChatId,
        content: inputMessage,
        sender: 'user'
      }]);

    if (messageError) {
      console.error('Error saving message:', messageError);
      return;
    }

    // Update chat title if this is the first message
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('chat_id', currentChatId);

    if (existingMessages && existingMessages.length === 1) {
      const title = inputMessage.split(' ')[0] || inputMessage.slice(0, 50);
      await updateChatTitle(currentChatId, title);
    }

    setMessages([...messages, newMessage]);
    setInputMessage("");
    setIsProcessing(true);
    isThinkingRef.current = true;

    try {
      // Make request to FastAPI backend
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          chat_id: currentChatId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();
      
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'agent',
        timestamp: new Date(),
      };
      
      // Save agent response to database
      await supabase
        .from('messages')
        .insert([{
          chat_id: currentChatId,
          content: agentResponse.content,
          sender: 'agent'
        }]);

      setMessages([...messages, agentResponse]);
    } catch (error) {
      console.error('Error getting response:', error);
      toast({
        title: "Error",
        description: "Failed to get response from AI",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      isThinkingRef.current = false;
    }
  };

  return (
    <div className="flex-1 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="w-full max-w-[500px] mx-auto">
          <ThreeScene isThinking={isThinkingRef.current} audioData={audioData} />
        </div>
        
        <Card className="p-6 bg-white/20 backdrop-blur-xl border-purple-100/50 shadow-xl rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-purple-50/30 pointer-events-none" />
          
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

export default ChatContainer;