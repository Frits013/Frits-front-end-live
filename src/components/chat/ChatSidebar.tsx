
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ChatHistoryComponent from "./ChatHistory";
import { ChatSession } from "@/types/chat";

interface ChatSidebarProps {
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  setChatSessions: (sessions: ChatSession[]) => void;
  setCurrentSessionId: (id: string | null) => void;
  onNewChat: () => void;
}

const ChatSidebar = ({
  chatSessions,
  currentSessionId,
  setChatSessions,
  setCurrentSessionId,
  onNewChat,
}: ChatSidebarProps) => {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Button
          onClick={onNewChat}
          variant="default"
          className="w-full flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Start New Consult
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Consult Session History</SidebarGroupLabel>
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
