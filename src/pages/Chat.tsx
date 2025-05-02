
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import ChatLayout from "@/components/chat/ChatLayout";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatContainer from "@/components/chat/ChatContainer";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useAuthOperations } from "@/hooks/use-auth-operations";
import { useOnboarding } from "@/hooks/use-onboarding";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const Chat = () => {
  const navigate = useNavigate();
  const {
    chatSessions,
    setChatSessions,
    currentSessionId,
    setCurrentSessionId,
    createNewChat,
    updateSessionTitle,
    markConsultFinished,
    isLoading,
  } = useChatSessions();

  const { 
    messages, 
    setMessages, 
    isConsultComplete, 
    setIsConsultComplete, 
    dialogDismissed, 
    setDialogDismissed,
    hasFeedback 
  } = useChatMessages(currentSessionId);
  
  const { handleSignOut, checkEmailConfirmation } = useAuthOperations();
  const { showOnboarding, setShowOnboarding } = useOnboarding();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authCheckCompleted, setAuthCheckCompleted] = useState(false);

  // Check if user is authenticated and has confirmed email
  useEffect(() => {
    // Only perform the check once
    if (authCheckCompleted) return;
    
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("No active session, navigating to login");
          navigate('/');
          return;
        }
        
        const isConfirmed = await checkEmailConfirmation();
        if (!isConfirmed) {
          console.log("Email not confirmed, navigating to login");
          navigate('/');
          return;
        }
        
        console.log("User authenticated and email confirmed");
      } catch (error) {
        console.error("Error checking authentication:", error);
        navigate('/');
      } finally {
        setIsCheckingAuth(false);
        setAuthCheckCompleted(true);
      }
    };
    
    checkAuth();
  }, [navigate, checkEmailConfirmation, authCheckCompleted]);

  const handleConsultFinish = (sessionId: string) => {
    // This now gets called only when the user clicks "End Session" in the dialog
    markConsultFinished(sessionId);
  };

  // Show loading state while checking auth or loading sessions
  if (isCheckingAuth || isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your consult sessions..." />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <ChatLayout
        sidebar={
          <ChatSidebar
            chatSessions={chatSessions}
            currentSessionId={currentSessionId}
            setChatSessions={setChatSessions}
            setCurrentSessionId={setCurrentSessionId}
            onNewChat={createNewChat}
            isLoading={isLoading}
          />
        }
        content={
          <>
            <ChatHeader onSignOut={handleSignOut} />
            <ChatContainer
              messages={messages}
              setMessages={setMessages}
              currentChatId={currentSessionId}
              updateChatTitle={updateSessionTitle}
              isConsultComplete={isConsultComplete}
              setIsConsultComplete={setIsConsultComplete}
              onConsultFinish={handleConsultFinish}
              dialogDismissed={dialogDismissed}
              setDialogDismissed={setDialogDismissed}
              hasFeedback={hasFeedback}
            />
            <OnboardingWizard
              open={showOnboarding}
              onComplete={() => setShowOnboarding(false)}
            />
          </>
        }
      />
    </SidebarProvider>
  );
};

export default Chat;
