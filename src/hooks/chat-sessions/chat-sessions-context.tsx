
import { createContext, useState, useContext, ReactNode } from "react";
import { ChatSession } from "@/types/chat";

interface ChatSessionsContextType {
  chatSessions: ChatSession[];
  setChatSessions: (sessions: ChatSession[]) => void;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  createNewChat: () => Promise<void>;
  setCreateNewChat: (fn: () => Promise<void>) => void;
}

// Create context with default values
const ChatSessionsContext = createContext<ChatSessionsContextType>({
  chatSessions: [],
  setChatSessions: () => {},
  currentSessionId: null,
  setCurrentSessionId: () => {},
  isLoading: false,
  setIsLoading: () => {},
  createNewChat: async () => {},
  setCreateNewChat: () => {},
});

export const ChatSessionsProvider = ({ children }: { children: ReactNode }) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createNewChat, setCreateNewChat] = useState<() => Promise<void>>(async () => {});

  return (
    <ChatSessionsContext.Provider
      value={{
        chatSessions,
        setChatSessions,
        currentSessionId,
        setCurrentSessionId,
        isLoading,
        setIsLoading,
        createNewChat,
        setCreateNewChat,
      }}
    >
      {children}
    </ChatSessionsContext.Provider>
  );
};

export const useChatSessionsContext = () => useContext(ChatSessionsContext);
