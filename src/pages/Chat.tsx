
import { SidebarProvider } from "@/components/ui/sidebar";
import ChatLayout from "@/components/chat/ChatLayout";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatContainer from "@/components/chat/ChatContainer";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useAuthOperations } from "@/hooks/use-auth-operations";

const Chat = () => {
  const {
    chatSessions,
    setChatSessions,
    currentSessionId,
    setCurrentSessionId,
    createNewChat,
    updateSessionTitle,
  } = useChatSessions();

  const { messages, setMessages } = useChatMessages(currentSessionId);
  const { handleSignOut } = useAuthOperations();

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
            />
          </>
        }
      />
    </SidebarProvider>
  );
};

export default Chat;
