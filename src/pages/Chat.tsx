
import { useEffect, useState, useRef } from "react";
import ChatContainer from "@/components/chat/ChatContainer";
import ChatLayout from "@/components/chat/ChatLayout";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import ChatSidebar from "@/components/chat/ChatSidebar";

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isThinkingRef = useRef(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  
  // Get the current session ID from the chat sessions hook
  const {
    chatSessions,
    currentSessionId,
    setCurrentSessionId,
    createNewChat,
    updateSessionTitle,
    markConsultFinished,
  } = useChatSessions();

  // Use the current session ID to fetch messages
  const {
    messages,
    setMessages,
    isConsultComplete,
    setIsConsultComplete,
    dialogDismissed,
    setDialogDismissed
  } = useChatMessages(currentSessionId);

  // Load user profile data
  const { 
    companyCode, 
    setCompanyCode,
    userDescription,
    setUserDescription,
    ttsEnabled,
    setTtsEnabled,
    isLoading: profileLoading,
    codeError,
    setCodeError,
    loadProfile,
    saveProfile
  } = useProfile();
  
  // Used for profile modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
        await loadProfile();
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
  }, [navigate, toast, loadProfile]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ChatLayout
      sidebar={
        <ChatSidebar
          chatSessions={chatSessions}
          currentSessionId={currentSessionId}
          setChatSessions={(sessions) => {
            /* We don't have direct access to this setter, but we're keeping the prop */
          }}
          setCurrentSessionId={setCurrentSessionId}
          onNewChat={createNewChat}
        />
      }
      content={
        <ChatContainer
          messages={messages}
          setMessages={setMessages}
          currentChatId={currentSessionId}
          updateChatTitle={updateSessionTitle}
          isConsultComplete={isConsultComplete}
          setIsConsultComplete={setIsConsultComplete}
          onConsultFinish={(sessionId) => markConsultFinished(sessionId)}
          dialogDismissed={dialogDismissed}
          setDialogDismissed={setDialogDismissed}
        />
      }
    />
  );
};

export default Chat;
