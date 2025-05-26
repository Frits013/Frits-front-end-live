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
        // Check if there's feedback for each finished session to determine if it's truly completed
        const sessionsWithFeedbackStatus = await Promise.all(
          sessions.map(async (session) => {
            if (!session.finished) {
              return { ...session, hasUserFeedback: false };
            }
            
            // Check if feedback exists for this session
            const { data: feedback } = await supabase
              .from('feedback')
              .select('id')
              .eq('session_id', session.id)
              .maybeSingle();
            
            return { ...session, hasUserFeedback: !!feedback };
          })
        );
        
        // Find sessions that are either:
        // 1. Not finished (ongoing)
        // 2. Finished but without user feedback (needs completion)
        const activeSession = sessionsWithFeedbackStatus.find(s => 
          !s.finished || (s.finished && !s.hasUserFeedback)
        );
        
        // If there's an active session, set it as current
        // Otherwise, fall back to the most recent session (even if completed)
        setCurrentSessionId(activeSession ? activeSession.id : sessions[0].id);
        console.log("Setting current session ID:", activeSession ? activeSession.id : sessions[0].id);
      }
    } catch (error) {
      console.error('Error in loadSessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { loadSessions };
};
