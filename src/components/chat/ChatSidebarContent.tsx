
import { SidebarContent } from "@/components/ui/sidebar";
import ChatSessionsSection from "./ChatSessionsSection";
import { SessionWithFeedback } from "@/types/chat";
import { AnimatePresence, motion } from "framer-motion";

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
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            key={`ongoing-${ongoingConsults.length}`}
          >
            <ChatSessionsSection
              title="Ongoing Consults"
              sessions={ongoingConsults}
              currentSessionId={currentSessionId}
              onSessionsUpdate={onSessionsUpdate}
              onSessionSelect={onSessionSelect}
              emptyMessage="No ongoing consults"
              emptySubMessage="Start a new consultation above"
            />
          </motion.div>
        </AnimatePresence>

        {/* Finishable consults section */}
        <AnimatePresence mode="wait">
          {finishableConsults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ 
                duration: 0.4,
                type: "spring",
                stiffness: 100,
                damping: 20
              }}
              key={`finishable-${finishableConsults.length}`}
            >
              <ChatSessionsSection
                title="Finishable Consults"
                sessions={finishableConsults}
                currentSessionId={currentSessionId}
                onSessionsUpdate={onSessionsUpdate}
                onSessionSelect={onSessionSelect}
                titleColor="text-amber-700 dark:text-amber-300"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completed consults section */}
        <AnimatePresence mode="wait">
          {completedConsults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              key={`completed-${completedConsults.length}`}
            >
              <ChatSessionsSection
                title="Completed Consults"
                sessions={completedConsults}
                currentSessionId={currentSessionId}
                onSessionsUpdate={onSessionsUpdate}
                onSessionSelect={onSessionSelect}
                titleColor="text-slate-600 dark:text-slate-400"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SidebarContent>
  );
};

export default ChatSidebarContent;
