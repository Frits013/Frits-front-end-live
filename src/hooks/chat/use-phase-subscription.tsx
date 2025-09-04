import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatSession } from "@/types/chat";

export const usePhaseSubscription = (
  sessionId: string | null,
  setSessionData: (data: ChatSession | null) => void
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


    return () => {
      supabase.removeChannel(sessionChannel);
    };
  }, [sessionId, setSessionData]);
};