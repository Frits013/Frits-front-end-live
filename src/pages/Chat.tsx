import { useEffect, useState, useRef } from "react";
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
  
  const { handleSignOut } = useAuthOperations();
  const { showOnboarding, setShowOnboarding } = useOnboarding();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const checkingRef = useRef(false);

  // Check if user is authenticated
  useEffect(() => {
    // Only perform the check if not already checking
    if (checkingRef.current) return;
    
    const checkAuth = async () => {
      checkingRef.current = true;
      setIsCheckingAuth(true);
      
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("No active session, navigating to login");
          navigate('/');
          return;
        }
        
        // Check if email is confirmed
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user || !user.email_confirmed_at) {
          console.log("Email not confirmed, navigating to login");
          await supabase.auth.signOut();
          navigate('/');
          return;
        }
        
        console.log("User authenticated and email confirmed");
      } catch (error) {
        console.error("Error checking authentication:", error);
        navigate('/');
      } finally {
        setIsCheckingAuth(false);
        checkingRef.current = false;
      }
    };
    
    checkAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/');
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleConsultFinish = (sessionId: string) => {
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
