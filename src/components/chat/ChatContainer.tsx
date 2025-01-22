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
  role: 'user' | 'assistant';
  created_at: Date;
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

  const generateChatTitle = async (messages: Message[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('summarize-chat', {
        body: { messages },
      });

      if (error) throw error;
      return data.summary;
    } catch (error) {
      console.error('Error generating chat title:', error);
      return null;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentChatId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      created_at: new Date(),
    };

    // Save message to database
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert([{
        session_id: currentChatId,
        content: inputMessage,
        role: 'user'
      }]);

    if (messageError) {
      console.error('Error saving message:', messageError);
      return;
    }

    setMessages([...messages, newMessage]);
    setInputMessage("");
    setIsProcessing(true);
    isThinkingRef.current = true;

    try {
      // Call Supabase Edge Function for chat response
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: inputMessage,
          session_id: currentChatId,
        },
      });

      if (error) throw error;
      
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        created_at: new Date(),
      };
      
      // Save agent response to database
      await supabase
        .from('chat_messages')
        .insert([{
          session_id: currentChatId,
          content: agentResponse.content,
          role: 'assistant'
        }]);

      const updatedMessages = [...messages, newMessage, agentResponse];
      setMessages(updatedMessages);

      // Generate and update chat title after the first exchange
      if (messages.length === 0) {
        const title = await generateChatTitle(updatedMessages);
        if (title) {
          await updateChatTitle(currentChatId, title);
        }
      }
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