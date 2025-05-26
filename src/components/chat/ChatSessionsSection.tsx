
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/components/ui/sidebar";
import { Sparkles } from "lucide-react";
import ChatHistoryComponent from "./ChatHistory";
import { SessionWithFeedback } from "@/types/chat";

interface ChatSessionsSectionProps {
  title: string;
  sessions: SessionWithFeedback[];
  currentSessionId: string | null;
  onSessionsUpdate: (sessions: SessionWithFeedback[]) => void;
  onSessionSelect: (id: string | null) => void;
  titleColor?: string;
  emptyMessage?: string;
  emptySubMessage?: string;
}

const ChatSessionsSection = ({
  title,
  sessions,
  currentSessionId,
  onSessionsUpdate,
  onSessionSelect,
  titleColor = "text-purple-700 dark:text-purple-300",
  emptyMessage = "No sessions",
  emptySubMessage = "Start a new consultation above"
}: ChatSessionsSectionProps) => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className={`px-3 mb-3 text-xs font-semibold ${titleColor} uppercase tracking-wider`}>
        {title}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        {sessions.length > 0 ? (
          <div className="space-y-2">
            <ChatHistoryComponent
              chatHistories={sessions}
              currentChatId={currentSessionId}
              setChatHistories={onSessionsUpdate}
              setCurrentChatId={onSessionSelect}
            />
          </div>
        ) : (
          <div className="px-3 py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {emptyMessage}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {emptySubMessage}
            </p>
          </div>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default ChatSessionsSection;
