import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";
import ChatHistoryComponent from "./ChatHistory";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface ChatSidebarProps {
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  setChatSessions: (sessions: ChatSession[]) => void;
  setCurrentSessionId: (id: string | null) => void;
  onNewChat: () => void;
  onSignOut: () => void;
}

const ChatSidebar = ({
  chatSessions,
  currentSessionId,
  setChatSessions,
  setCurrentSessionId,
  onNewChat,
  onSignOut,
}: ChatSidebarProps) => {
  return (
    <Sidebar>
      <SidebarHeader className="p-4 space-y-2">
        <Button
          onClick={onNewChat}
          variant="default"
          className="w-full flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
        <Button
          onClick={onSignOut}
          variant="outline"
          className="w-full flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chat History</SidebarGroupLabel>
          <SidebarGroupContent>
            <ChatHistoryComponent
              chatHistories={chatSessions}
              currentChatId={currentSessionId}
              setChatHistories={setChatSessions}
              setCurrentChatId={setCurrentSessionId}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default ChatSidebar;