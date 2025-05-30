
import { SidebarContent } from "@/components/ui/sidebar";
import ChatSessionsSection from "./ChatSessionsSection";
import { SessionWithFeedback } from "@/types/chat";
import { AnimatePresence } from "framer-motion";

interface ChatSidebarContentProps {
  ongoingConsults: SessionWithFeedback[];
  finishableConsults: SessionWithFeedback[];
  completedConsults: SessionWithFeedback[];
  currentSessionId: string | null;
  onSessionsUpdate: (sessions: SessionWithFeedback[]) => void;
  onSessionSelect: (id: string | null) => void;
}

const ChatSidebarContent = ({
  ongoingConsults,
  finishableConsults,
  completedConsults,
  currentSessionId,
  onSessionsUpdate,
  onSessionSelect
}: ChatSidebarContentProps) => {
  return (
    <SidebarContent className="flex-1 overflow-auto px-3 py-4">
      <div className="space-y-6">
        {/* Ongoing consults section */}
        <ChatSessionsSection
          title="Ongoing Consults"
          sessions={ongoingConsults}
          currentSessionId={currentSessionId}
          onSessionsUpdate={onSessionsUpdate}
          onSessionSelect={onSessionSelect}
          emptyMessage="No ongoing consults"
          emptySubMessage="Start a new consultation above"
        />

        {/* Finishable consults section */}
        <ChatSessionsSection
          title="Finishable Consults"
          sessions={finishableConsults}
          currentSessionId={currentSessionId}
          onSessionsUpdate={onSessionsUpdate}
          onSessionSelect={onSessionSelect}
          titleColor="text-amber-700 dark:text-amber-300"
        />

        {/* Completed consults section */}
        <ChatSessionsSection
          title="Completed Consults"
          sessions={completedConsults}
          currentSessionId={currentSessionId}
          onSessionsUpdate={onSessionsUpdate}
          onSessionSelect={onSessionSelect}
          titleColor="text-slate-600 dark:text-slate-400"
        />
      </div>
    </SidebarContent>
  );
};

export default ChatSidebarContent;
