
import { useEffect, useState } from "react";
import ChatContainer from "@/components/chat/ChatContainer";
import ChatLayout from "@/components/chat/ChatLayout";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    messages,
    setMessages,
    errorMessage,
    setErrorMessage,
    isThinkingRef,
    isProcessing,
    setIsProcessing,
    audioData,
    sendMessage,
    retryMessage,
  } = useChatMessages();

  const {
    chatSessions,
    currentChatId,
    setCurrentChatId,
    createNewChat,
    renameChatSession,
    isConsultComplete,
    setIsConsultComplete,
    dialogDismissed,
    setDialogDismissed,
    finishConsultSession,
  } = useChatSessions(setMessages);

  const { profile, loadProfileData, updateProfile, isProfileModalOpen, setIsProfileModalOpen } = useProfile();

  // Check authentication and email confirmation
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.error("Authentication error:", error);
          navigate('/');
          return;
        }
        
        // Check if email is confirmed
        const user = session.user;
        if (!user || !user.email_confirmed_at) {
          console.log("Email not confirmed, redirecting to login");
          await supabase.auth.signOut();
          
          toast({
            title: "Email Not Confirmed",
            description: "Please confirm your email address before accessing the chat.",
            variant: "destructive",
          });
          
          navigate('/');
          return;
        }
        
        // User is authenticated and email confirmed
        await loadProfileData();
        setIsLoading(false);
      } catch (error) {
        console.error("Auth check error:", error);
        navigate('/');
      }
    };

    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/');
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast, loadProfileData]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ChatLayout
      chatSessions={chatSessions}
      currentChatId={currentChatId}
      setCurrentChatId={setCurrentChatId}
      createNewChat={createNewChat}
      profile={profile}
      updateProfile={updateProfile}
      isProfileModalOpen={isProfileModalOpen}
      setIsProfileModalOpen={setIsProfileModalOpen}
    >
      <ChatContainer
        messages={messages}
        setMessages={setMessages}
        currentChatId={currentChatId}
        updateChatTitle={renameChatSession}
        isConsultComplete={isConsultComplete}
        setIsConsultComplete={setIsConsultComplete}
        onConsultFinish={finishConsultSession}
        dialogDismissed={dialogDismissed}
        setDialogDismissed={setDialogDismissed}
      />
    </ChatLayout>
  );
};

export default Chat;
