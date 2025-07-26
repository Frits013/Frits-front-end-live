import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatSession, InterviewProgress } from "@/types/chat";

export const usePhaseSubscription = (
  sessionId: string | null,
  setSessionData: (data: ChatSession | null) => void,
  setCurrentProgress: (progress: InterviewProgress | null) => void
) => {
  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to session changes (phase transitions)
    const sessionChannel = supabase
      .channel(`session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Session updated:', payload);
          setSessionData(payload.new as ChatSession);
        }
      )
      .subscribe();

    // Subscribe to interview progress changes
    const progressChannel = supabase
      .channel(`progress_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interview_progress',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Interview progress updated:', payload);
          if (payload.eventType === 'DELETE') {
            setCurrentProgress(null);
          } else {
            setCurrentProgress(payload.new as InterviewProgress);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(progressChannel);
    };
  }, [sessionId, setSessionData, setCurrentProgress]);
};