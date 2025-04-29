
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
    <Sidebar className="h-full w-full flex flex-col">
      <SidebarHeader className="p-4 flex-shrink-0">
        <Button
          onClick={onNewChat}
          variant="default"
          className="w-full flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Start New Consult
        </Button>
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel>Consult Session History</SidebarGroupLabel>
          <SidebarGroupContent className="w-full">
            {chatSessions.length > 0 ? (
              <ChatHistoryComponent
                chatHistories={chatSessions}
                currentChatId={currentSessionId}
                setChatHistories={setChatSessions}
                setCurrentChatId={setCurrentSessionId}
              />
            ) : (
              <div className="px-2 py-4 text-sm text-muted-foreground">
                No consult history available.
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default ChatSidebar;
