import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import ThreeScene from "@/components/chat/ThreeScene";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  message: string;
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
  
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Session check:', session ? 'Session exists' : 'No session');
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
      console.log('Preparing to send message to FastAPI server...');
      console.log('Current chat ID:', currentChatId);
      
      // Retrieve the Supabase access token from the session
      const supabaseToken = session.access_token; // Ensure this is the correct token
  
      // First, get a FastAPI token from your FastAPI server using the Supabase token
      const tokenResponse = await fetch('https://demo-fastapi-app.onrender.com/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supabase_token: supabaseToken, // Correct field name
        }),
      });
  
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token error response:', errorText);
        throw new Error('Failed to get FastAPI token');
      }
  
      const { access_token } = await tokenResponse.json();
      console.log('Successfully obtained FastAPI token');
      
      // Now use this FastAPI token for the chat request
      const response = await fetch('https://demo-fastapi-app.onrender.com/chat/send_message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`, // Correct usage for authenticated requests
        },
        body: JSON.stringify({
          message: inputMessage,
          session_id: currentChatId,
        }),
      });
  
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
  
      const data = await response.json();
      console.log('Received response:', data);
      
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        message: data.response,
        role: 'assistant',
        created_at: new Date(),
      };
  
      const updatedMessages = [...messages, newMessage, agentResponse];
      setMessages(updatedMessages);
  
      // Generate and update chat title after the first exchange
      if (messages.length === 0) {
        const title = await generateChatTitle(updatedMessages);
        if (title && currentChatId) {
          await updateChatTitle(currentChatId, title);
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