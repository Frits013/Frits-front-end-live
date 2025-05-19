
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSessionSubscription = (
  sessionId: string | null, 
  isConsultComplete: boolean, 
  setIsConsultComplete: (isComplete: boolean) => void,
  setDialogDismissed: (dismissed: boolean) => void,
  setHasFeedback: (hasFeedback: boolean) => void
) => {
  // Set up a subscription to listen for changes to the chat_sessions table
  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to changes on the specific session
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          // Check if the finished status has changed
          const newFinishedStatus = payload.new.finished;
          if (newFinishedStatus !== isConsultComplete) {
            console.log('Session finished status changed:', newFinishedStatus);
            setIsConsultComplete(newFinishedStatus);
            
            // Important: Reset dialog dismissed state when session is newly marked as complete
            if (newFinishedStatus) {
              setDialogDismissed(false);
              // We'll check if feedback exists separately
              checkFeedbackExists(sessionId);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, isConsultComplete, setIsConsultComplete, setDialogDismissed]);

  // Helper function to check if feedback exists for a session
  const checkFeedbackExists = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking feedback existence:', error);
      } else {
        setHasFeedback(!!data);
        // If feedback exists, consider the dialog dismissed
        if (data) {
          setDialogDismissed(true);
        }
      }
    } catch (error) {
      console.error('Error in checkFeedbackExists:', error);
    }
  };
};
