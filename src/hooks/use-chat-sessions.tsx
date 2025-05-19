
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionCreation } from "./chat-sessions/use-session-creation";
import { useSessionManagement } from "./chat-sessions/use-session-management";
import { useSessionsLoader } from "./chat-sessions/use-sessions-loader";
import { useAuthListener } from "./chat-sessions/use-auth-listener";
import { ChatSession } from "@/types/chat";

export const useChatSessions = () => {
  const navigate = useNavigate();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Use a ref to handle the circular dependency between loadSessions and createNewChat
  const createNewChatRef = useRef<() => Promise<void>>(() => Promise.resolve());
  
  // Initialize session creation hook
  const sessionCreation = useSessionCreation(
    chatSessions,
    setChatSessions,
    setCurrentSessionId
  );
  
  // Set the reference to the actual createNewChat function
  createNewChatRef.current = sessionCreation.createNewChat;
  
  // Initialize session management hook
  const {
    updateSessionTitle,
    markConsultFinished
  } = useSessionManagement(setChatSessions);
  
  // Initialize sessions loader hook
  const { loadSessions } = useSessionsLoader(
    currentSessionId,
    setCurrentSessionId,
    createNewChatRef.current,
    setChatSessions,
    setIsLoading,
    navigate
  );

  // Set up auth listener
  useAuthListener({
    loadSessions,
    setChatSessions,
    setCurrentSessionId
  });

  // Initial load of sessions
  useEffect(() => {
    loadSessions();
  }, []);

  return {
    chatSessions,
    setChatSessions,
    currentSessionId,
    setCurrentSessionId,
    createNewChat: sessionCreation.createNewChat,
    updateSessionTitle,
    markConsultFinished,
    isLoading,
  };
};
