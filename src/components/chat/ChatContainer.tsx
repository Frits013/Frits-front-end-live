
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import ThreeScene from "@/components/chat/ThreeScene";
import ChatMessageList from "@/components/chat/ChatMessageList";
import ChatInput from "@/components/chat/ChatInput";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/types/chat";
import { config } from "@/config/environment";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import ConsultCompleteDialog from "@/components/chat/ConsultCompleteDialog";

interface ChatContainerProps {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  currentChatId: string | null;
  updateChatTitle: (chatId: string, newTitle: string) => Promise<boolean>;
  isConsultComplete: boolean;
  setIsConsultComplete: (isComplete: boolean) => void;
  onConsultFinish: (sessionId: string) => void;
}

const ChatContainer = ({
  messages,
  setMessages,
  currentChatId,
  updateChatTitle,
  isConsultComplete,
  setIsConsultComplete,
  onConsultFinish,
}: ChatContainerProps) => {
  const { toast } = useToast();
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const isThinkingRef = useRef(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [dialogDismissed, setDialogDismissed] = useState(false);

  // Watch for changes in isConsultComplete to show dialog
  useEffect(() => {
    if (isConsultComplete && !showCompleteDialog && !dialogDismissed) {
      setShowCompleteDialog(true);
    }
  }, [isConsultComplete, showCompleteDialog, dialogDismissed]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentChatId) return;
  
    // Clear any previous error message
    setErrorMessage(null);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      toast({
        title: "Error",
        description: "Session error: " + sessionError.message,
        variant: "destructive",
      });
      return;
    }
  
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to send messages",
        variant: "destructive",
      });
      return;
    }
  
    // Generate a unique message_id using crypto.randomUUID()
    const message_id = crypto.randomUUID();
    
    // Create a new user message
    const newUserMessage: ChatMessage = {
      id: message_id, // Use the generated message_id
      content: inputMessage,
      role: 'user',
      created_at: new Date(),
    };
  
    // Update UI with user message
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    setIsProcessing(true);
    isThinkingRef.current = true;
  
    try {
      // Save the user message to Supabase
      const { error: saveError } = await supabase
        .from('chat_messages')
        .insert({
          message_id, // Use the same message_id
          content: inputMessage,
          role: 'user',
          user_id: session.user.id,
          session_id: currentChatId,
        });

      if (saveError) {
        console.error('Error saving message:', saveError);
        throw new Error('Failed to save message');
      }

      // Log token details for debugging
      const token = session.access_token;
      console.log('Session object available:', !!session);
      console.log('Access token type:', typeof token);
      console.log('Access token length:', token.length);
      console.log('Access token prefix:', token.substring(0, 15) + '...');
      
      console.log('Making chat function call with:', {
        session_id: currentChatId,
        message_id: message_id,
      });
      
      // Call the Supabase Edge Function with the JWT token
      const functionResponse = await supabase.functions.invoke('chat', {
        body: {
          session_id: currentChatId,
          message_id,
          message: inputMessage, // Include the message content
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Function response received:', functionResponse);
      
      // Check for errors in the response
      if (functionResponse.error) {
        console.error('Error from edge function:', functionResponse.error);
        throw new Error(`Edge function error: ${functionResponse.error.message || 'Unknown error'}`);
      }
      
      // Check for errors in the data payload
      const data = functionResponse.data;
      if (!data) {
        throw new Error('No data returned from edge function');
      }
      
      // Handle errors in the data response
      if (data.error) {
        console.error('Error in response data:', data.error);
        setErrorMessage(data.message || data.details || data.error || 'Error from backend');
        // Don't throw here - we'll still display this in the UI
      }
      
      // After receiving response, check the session status again
      const { data: sessionData, error: sessionCheckError } = await supabase
        .from('chat_sessions')
        .select('finished')
        .eq('id', currentChatId)
        .single();
        
      if (!sessionCheckError && sessionData && sessionData.finished) {
        console.log('Session is marked as completed in the database');
        setIsConsultComplete(true);
      }
      
      // Get response content, prioritizing the 'response' field
      const responseContent = data.response || "No response generated";
      
      // Create the assistant response message
      const agentResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        role: 'assistant',
        created_at: new Date(),
      };
  
      // Check for duplicate messages
      const existingMessage = updatedMessages.find(m => 
        m.role === 'assistant' && m.content === responseContent
      );
      
      if (!existingMessage) {
        // Update messages including both user message and assistant response
        setMessages([...updatedMessages, agentResponse]);
      }
  
    } catch (error) {
      console.error('Error getting response:', error);
      
      // Set detailed error message for UI display
      setErrorMessage(error instanceof Error ? error.message : "Failed to get response from AI");
      
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

  const handleFinishConsult = () => {
    if (currentChatId) {
      onConsultFinish(currentChatId);
      toast({
        title: "Success",
        description: "Consult session marked as complete",
      });
    }
    setShowCompleteDialog(false);
    setDialogDismissed(true);
  };

  const handleContinueChat = () => {
    setShowCompleteDialog(false);
    setDialogDismissed(true);
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
            {errorMessage && (
              <Alert variant="destructive" className="mx-4 mt-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}
            
            <ChatMessageList messages={messages} />
            <div className="p-4 mt-auto">
              <ChatInput
                inputMessage={inputMessage}
                setInputMessage={setInputMessage}
                handleSendMessage={handleSendMessage}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        </Card>
      </div>

      <ConsultCompleteDialog
        open={showCompleteDialog}
        onClose={handleContinueChat}
        onFinish={handleFinishConsult}
      />
    </div>
  );
};

export default ChatContainer;
