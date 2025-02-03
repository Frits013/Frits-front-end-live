import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import ThreeScene from "@/components/chat/ThreeScene";
import ChatMessageList from "@/components/chat/ChatMessageList";
import ChatInput from "@/components/chat/ChatInput";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/types/chat";

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
    if (!currentChatId) {
      console.log('Skipping title generation - no chat ID');
      return null;
    }

    try {
      console.log('Attempting to generate chat title...');
      const { data, error } = await supabase.functions.invoke('summarize-chat', {
        body: { messages },
      });

      if (error) {
        console.error('Error generating chat title:', error);
        return null;
      }
      
      console.log('Successfully generated chat title:', data?.summary);
      return data.summary;
    } catch (error) {
      console.error('Error generating chat title:', error);
      return null;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentChatId) return;
  
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
    }
  
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to send messages",
        variant: "destructive",
      });
      return;
    }
  
    const newMessage: Message = {
      id: Date.now().toString(),
      message: inputMessage,
      role: 'user',
      created_at: new Date(),
    };
  
    setMessages([...messages, newMessage]);
    setInputMessage("");
    setIsProcessing(true);
    isThinkingRef.current = true;
  
    try {
      const supabaseToken = session.access_token;
  
      const tokenResponse = await fetch('https://demo-fastapi-app.onrender.com/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supabase_token: supabaseToken,
        }),
      });
  
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token error response:', errorText);
        throw new Error('Failed to get FastAPI token');
      }
  
      const { access_token } = await tokenResponse.json();
      
      const response = await fetch('https://demo-fastapi-app.onrender.com/chat/send_message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          message: inputMessage,
          session_id: currentChatId,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        message: data.response,
        role: 'assistant',
        created_at: new Date(),
      };
  
      const updatedMessages = [...messages, newMessage, agentResponse];
      setMessages(updatedMessages);
  
      if (messages.length === 0 && currentChatId) {
        try {
          const title = await generateChatTitle(updatedMessages);
          if (title) {
            await updateChatTitle(currentChatId, title);
          }
        } catch (error) {
          console.error('Error in title generation:', error);
        }
      }
    } catch (error) {
      console.error('Error getting response:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response from AI",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      isThinkingRef.current = false;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[100dvh] w-full">
      <div className="flex-1 overflow-hidden p-4 flex flex-col">
        <div className="w-full max-w-[500px] mx-auto mb-8">
          <div className="aspect-square w-full">
            <ThreeScene isThinking={isThinkingRef.current} audioData={audioData} />
          </div>
        </div>
        
        <Card className="flex-1 flex flex-col bg-white/20 backdrop-blur-xl border-purple-100/50 shadow-xl rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-purple-50/30 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full">
            <ChatMessageList messages={messages} />
            <div className="p-4 mt-auto">
              <ChatInput
                inputMessage={inputMessage}
                setInputMessage={setInputMessage}
                handleSendMessage={handleSendMessage}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatContainer;