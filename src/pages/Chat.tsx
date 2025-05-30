
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sidebar, SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatContainer from "@/components/chat/ChatContainer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useSessionSubscription } from "@/hooks/chat/use-session-subscription";

const Chat = () => {
  const { id } = useParams<{ id?: string }>();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [isConsultComplete, setIsConsultComplete] = useState(false);
  const [dialogDismissed, setDialogDismissed] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);
  
  // Force refresh trigger for sidebar
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const {
    chatSessions,
    currentSessionId,
    isLoading: sessionsLoading,
    setChatSessions,
    setCurrentSessionId,
    createNewSession,
    updateChatTitle
  } = useChatSessions(id);

  const {
    messages,
    isLoading: messagesLoading,
    setMessages
  } = useChatMessages(currentSessionId);

  // Callback to force sidebar refresh when session status changes
  const handleSessionStatusChange = () => {
    console.log('Session status changed - forcing sidebar refresh');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleConsultFinish = async (sessionId: string) => {
    try {
      console.log('Submitting feedback and finishing session:', sessionId);
      
      // Mark as finished in the local state first for immediate UI update
      setIsConsultComplete(true);
      setHasFeedback(true);
      
      // Update the session list to reflect the change
      setChatSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === sessionId 
            ? { ...session, finished: true }
            : session
        )
      );
      
    } catch (error) {
      console.error('Error finishing consult:', error);
      toast({
        title: "Error",
        description: "Failed to finish consult session",
        variant: "destructive",
      });
    }
  };

  const handleNewChat = () => {
    createNewSession();
  };

  if (sessionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <ChatSidebar
            key={refreshTrigger} // Force re-render when refresh trigger changes
            chatSessions={chatSessions}
            currentSessionId={currentSessionId}
            setChatSessions={setChatSessions}
            setCurrentSessionId={setCurrentSessionId}
            onNewChat={handleNewChat}
            isLoading={sessionsLoading}
          />
        </Sidebar>
        
        <SidebarInset className="flex-1">
          <div className="h-screen">
            <ChatContainer
              messages={messages}
              setMessages={setMessages}
              currentChatId={currentSessionId}
              updateChatTitle={updateChatTitle}
              isConsultComplete={isConsultComplete}
              setIsConsultComplete={setIsConsultComplete}
              onConsultFinish={handleConsultFinish}
              dialogDismissed={dialogDismissed}
              setDialogDismissed={setDialogDismissed}
              hasFeedback={hasFeedback}
              onSessionStatusChange={handleSessionStatusChange} // Pass the callback
            />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Chat;
