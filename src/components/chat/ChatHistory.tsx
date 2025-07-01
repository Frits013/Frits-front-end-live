
import ChatHistoryItem from "./ChatHistoryItem";
import ChatHistoryEditItem from "./ChatHistoryEditItem";
import { SessionWithFeedback } from "@/types/chat";
import { AnimatePresence, motion } from "framer-motion";
import { useChatOperations } from "@/hooks/chat/use-chat-operations";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatHistoryProps {
  chatHistories: SessionWithFeedback[];
  currentChatId: string | null;
  setChatHistories: (chats: SessionWithFeedback[]) => void;
  setCurrentChatId: (id: string | null) => void;
  animationState?: {
    shouldAnimate: boolean;
    sessionId?: string;
  };
}

const ChatHistoryComponent = ({
  chatHistories,
  currentChatId,
  setChatHistories,
  setCurrentChatId,
  animationState,
}: ChatHistoryProps) => {
  const {
    editingChatId,
    editingTitle,
    setEditingTitle,
    handleEditTitle,
    handleSaveTitle,
    handleCancelEdit,
    handleDeleteChat
  } = useChatOperations(chatHistories, setChatHistories, currentChatId, setCurrentChatId);

  const [animatingSession, setAnimatingSession] = useState<string | null>(null);

  // Handle animation trigger
  useEffect(() => {
    if (animationState?.shouldAnimate && animationState.sessionId) {
      console.log('Starting fade animation for session:', animationState.sessionId);
      setAnimatingSession(animationState.sessionId);
      
      // Clear animation state after animation completes
      setTimeout(() => {
        setAnimatingSession(null);
      }, 600);
    }
  }, [animationState]);

  if (chatHistories.length === 0) {
    return null;
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 px-3 pb-4">
        <AnimatePresence mode="popLayout">
          {chatHistories.map((chat) => (
            <motion.div
              key={chat.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: animatingSession === chat.id ? 0.3 : 1, 
                x: 0,
                scale: animatingSession === chat.id ? 0.98 : 1
              }}
              exit={{ 
                opacity: 0, 
                x: 20,
                scale: 0.95,
                transition: { duration: 0.2 }
              }}
              transition={{ 
                duration: animatingSession === chat.id ? 0.6 : 0.3,
                type: "spring",
                stiffness: 120,
                damping: 20
              }}
              whileHover={{ scale: animatingSession === chat.id ? 0.98 : 1.02 }}
              whileTap={{ scale: animatingSession === chat.id ? 0.96 : 0.98 }}
              className={animatingSession === chat.id ? "pointer-events-none" : ""}
            >
              {editingChatId === chat.id ? (
                <ChatHistoryEditItem
                  editingTitle={editingTitle}
                  onTitleChange={setEditingTitle}
                  onSave={() => handleSaveTitle(chat.id)}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <ChatHistoryItem
                  id={chat.id}
                  title={chat.session_name}
                  isActive={currentChatId === chat.id}
                  isCompleted={chat.finished && chat.hasUserFeedback}
                  isFinishable={chat.isFinishable || false}
                  onSelect={() => setCurrentChatId(chat.id)}
                  onEdit={() => handleEditTitle(chat)}
                  onDelete={handleDeleteChat}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
};

export default ChatHistoryComponent;
