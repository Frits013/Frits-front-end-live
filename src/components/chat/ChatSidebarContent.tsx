
import { SidebarContent } from "@/components/ui/sidebar";
import ChatSessionsSection from "./ChatSessionsSection";
import { SessionWithFeedback } from "@/types/chat";

interface ChatSidebarContentProps {
  ongoingConsults: SessionWithFeedback[];
  finishableConsults: SessionWithFeedback[];
  completedConsults: SessionWithFeedback[];
  currentSessionId: string | null;
  onSessionsUpdate: (sessions: SessionWithFeedback[]) => void;
  onSessionSelect: (id: string | null) => void;
  animationState?: {
    shouldAnimate: boolean;
    sessionId?: string;
  };
}

const ChatSidebarContent = ({
  ongoingConsults,
  finishableConsults,
  completedConsults,
  currentSessionId,
  onSessionsUpdate,
  onSessionSelect,
  animationState
}: ChatSidebarContentProps) => {
  return (
    <SidebarContent className="flex-1 min-h-0 overflow-hidden bg-gradient-to-b from-slate-50 to-purple-50/30 dark:from-slate-900 dark:to-purple-950/30">
      <div className="h-full flex flex-col px-3 py-4 overflow-hidden">
        <ChatSessionsSection
          title="All Consults"
          sessions={[...ongoingConsults, ...finishableConsults, ...completedConsults]}
          currentSessionId={currentSessionId}
          onSessionsUpdate={onSessionsUpdate}
          onSessionSelect={onSessionSelect}
          emptyMessage="No consults yet"
          emptySubMessage="Start a new consultation above"
          animationState={animationState}
        />
      </div>
    </SidebarContent>
  );
};

export default ChatSidebarContent;
