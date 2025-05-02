
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ChatSidebarProps {
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  setChatSessions: (sessions: ChatSession[]) => void;
  setCurrentSessionId: (id: string | null) => void;
  onNewChat: () => void;
  isLoading?: boolean;
}

const ChatSidebar = ({
  chatSessions,
  currentSessionId,
  setChatSessions,
  setCurrentSessionId,
  onNewChat,
  isLoading = false,
}: ChatSidebarProps) => {
  // Separate ongoing and completed consults
  const ongoingConsults = chatSessions.filter(chat => !chat.finished);
  const completedConsults = chatSessions.filter(chat => chat.finished);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <Button
          onClick={onNewChat}
          variant="default"
          className="w-full flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Start New Consult
        </Button>
      </div>
      <div className="flex-1 overflow-auto py-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="sm" text="Loading sessions..." />
          </div>
        ) : (
          <>
            {/* Ongoing consults section */}
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 mb-2 text-sm font-medium text-muted-foreground">
                Ongoing Consults
              </SidebarGroupLabel>
              <SidebarGroupContent className="px-2">
                {ongoingConsults.length > 0 ? (
                  <ChatHistoryComponent
                    chatHistories={ongoingConsults}
                    currentChatId={currentSessionId}
                    setChatHistories={setChatSessions}
                    setCurrentChatId={setCurrentSessionId}
                  />
                ) : (
                  <div className="px-2 py-4 text-sm text-muted-foreground">
                    No ongoing consults available.
                  </div>
                )}
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Completed consults section */}
            {completedConsults.length > 0 && (
              <SidebarGroup className="mt-4">
                <SidebarGroupLabel className="px-3 mb-2 text-sm font-medium text-muted-foreground">
                  Completed Consults
                </SidebarGroupLabel>
                <SidebarGroupContent className="px-2">
                  <ChatHistoryComponent
                    chatHistories={completedConsults}
                    currentChatId={currentSessionId}
                    setChatHistories={setChatSessions}
                    setCurrentChatId={setCurrentSessionId}
                  />
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
