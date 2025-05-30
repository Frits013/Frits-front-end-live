
import ChatHistoryItem from "./ChatHistoryItem";
import ChatHistoryEditItem from "./ChatHistoryEditItem";
import { SessionWithFeedback } from "@/types/chat";
import { AnimatePresence, motion } from "framer-motion";
import { useChatOperations } from "@/hooks/chat/use-chat-operations";

interface ChatHistoryProps {
  chatHistories: SessionWithFeedback[];
  currentChatId: string | null;
  setChatHistories: (chats: SessionWithFeedback[]) => void;
  setCurrentChatId: (id: string | null) => void;
}

const ChatHistoryComponent = ({
  chatHistories,
  currentChatId,
  setChatHistories,
  setCurrentChatId,
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

  if (chatHistories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {chatHistories.map((chat) => (
          <motion.div
            key={chat.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ 
              opacity: 0, 
              x: 20,
              scale: 0.95,
              transition: { duration: 0.2 }
            }}
            transition={{ 
              duration: 0.3,
              type: "spring",
              stiffness: 120,
              damping: 20
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
  );
};

export default ChatHistoryComponent;
