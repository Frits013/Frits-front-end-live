
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

const Chat = () => {
  const {
    chatSessions,
    setChatSessions,
    currentSessionId,
    setCurrentSessionId,
    createNewChat,
    updateSessionTitle,
    markConsultFinished,
  } = useChatSessions();

  const { messages, setMessages, isConsultComplete, setIsConsultComplete, dialogDismissed, setDialogDismissed } = useChatMessages(currentSessionId);
  const { handleSignOut } = useAuthOperations();
  const { showOnboarding, setShowOnboarding } = useOnboarding();

  const handleConsultFinish = (sessionId: string) => {
    markConsultFinished(sessionId);
  };

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
