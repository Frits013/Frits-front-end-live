import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChatSession } from "@/types/chat";

export const useSessionsLoader = (
  currentSessionId: string | null,
  setCurrentSessionId: (id: string | null) => void,
  createNewChat: () => Promise<void>,
  setChatSessions: (sessions: ChatSession[]) => void,
  setIsLoading: (loading: boolean) => void,
  navigate: ReturnType<typeof useNavigate>
) => {
  const loadSessions = async () => {
    setIsLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsLoading(false);
      navigate('/');
      return;
    }
    
    console.log("Loading chat sessions for user:", session.user.id);
    
    try {
      // Query sessions from the chat_sessions table
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        setIsLoading(false);
        return;
      }

      console.log("Retrieved sessions:", sessions?.length || 0);
      setChatSessions(sessions || []);

      if (sessions && sessions.length === 0) {
        console.log('No existing sessions, creating new one...');
        await createNewChat();
      } else if (sessions && sessions.length > 0 && !currentSessionId) {
        // Find the most recent ongoing session first
        const ongoingSession = sessions.find(s => !s.finished);
        
        // If there's an ongoing session, set it as current
        // Otherwise, fall back to the most recent session (which would be completed)
        setCurrentSessionId(ongoingSession ? ongoingSession.id : sessions[0].id);
        console.log("Setting current session ID:", ongoingSession ? ongoingSession.id : sessions[0].id);
      }
    } catch (error) {
      console.error('Error in loadSessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { loadSessions };
};
