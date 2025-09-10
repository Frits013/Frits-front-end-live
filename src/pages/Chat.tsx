
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ChatContainer from "@/components/chat/ChatContainer";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useAuthOperations } from "@/hooks/use-auth-operations";
import { useOnboarding } from "@/hooks/use-onboarding";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import WelcomeAnimation from "@/components/chat/WelcomeAnimation";
import SessionCreationLoader from "@/components/chat/SessionCreationLoader";

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
    hasFeedback,
    isProcessing,
    setIsProcessing,
    sessionData,
    demoPhaseData
  } = useChatMessages(currentSessionId);
  
  const { handleSignOut } = useAuthOperations();
  const { showOnboarding, setShowOnboarding } = useOnboarding();
  const [sessionAnimationState, setSessionAnimationState] = useState<{
    shouldAnimate: boolean;
    sessionId?: string;
  }>({ shouldAnimate: false });
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Listen for auth state changes only
  useEffect(() => {
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

  const handleSessionAnimation = (shouldAnimate: boolean, sessionId?: string) => {
    setSessionAnimationState({ shouldAnimate, sessionId });
  };

  const handleCreateNewChat = async () => {
    setIsCreatingSession(true);
    try {
      await createNewChat();
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Show loading state while loading sessions
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your consult sessions..." />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <WelcomeAnimation currentSessionId={currentSessionId} />
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
        onSessionAnimation={handleSessionAnimation}
        sessionData={sessionData}
        demoPhaseData={demoPhaseData}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
        createNewChat={handleCreateNewChat}
      />
      <OnboardingWizard
        open={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />
      <SessionCreationLoader isVisible={isCreatingSession} />
    </div>
  );
};

export default Chat;
