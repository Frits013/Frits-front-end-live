
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSessionSubscription = (
  sessionId: string | null, 
  isConsultComplete: boolean, 
  setIsConsultComplete: (isComplete: boolean) => void,
  setDialogDismissed: (dismissed: boolean) => void,
  setHasFeedback: (hasFeedback: boolean) => void,
  onSessionStatusChange?: () => void // Add callback to trigger sidebar updates
) => {
  // Initial state check when session changes or page loads
  useEffect(() => {
    if (!sessionId) return;

    const checkInitialState = async () => {
      console.log('Checking initial session state for:', sessionId);
      
      try {
        // Check session finished status
        const { data: sessionData, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('finished')
          .eq('id', sessionId)
          .single();

        if (sessionError) {
          console.error('Error checking session status:', sessionError);
          return;
        }

        if (sessionData) {
          console.log('Initial session finished status:', sessionData.finished);
          setIsConsultComplete(sessionData.finished);
          
          // If session is finished, check for feedback and reset dialog state
          if (sessionData.finished) {
            console.log('Session is finished, checking feedback and resetting dialog state');
            setDialogDismissed(false); // Reset dialog dismissed state
            await checkFeedbackExists(sessionId);
          }
        }
      } catch (error) {
        console.error('Error in checkInitialState:', error);
      }
    };

    checkInitialState();
  }, [sessionId, setIsConsultComplete, setDialogDismissed, setHasFeedback]);

  // Set up a subscription to listen for changes to the chat_sessions table
  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up session subscription for session:', sessionId);

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
        async (payload) => {
          console.log('Session update received:', payload);
          
          // Check if the finished status has changed
          const newFinishedStatus = payload.new.finished;
          const oldFinishedStatus = payload.old?.finished;
          
          console.log('Finished status - old:', oldFinishedStatus, 'new:', newFinishedStatus);
          
          // Only update if the status actually changed
          if (newFinishedStatus !== oldFinishedStatus) {
            console.log('Session finished status changed to:', newFinishedStatus);
            setIsConsultComplete(newFinishedStatus);
            
            // Important: Reset dialog dismissed state when session status changes
            if (newFinishedStatus) {
              console.log('Resetting dialog dismissed state and checking feedback');
              setDialogDismissed(false);
              // Check if feedback exists separately
              await checkFeedbackExists(sessionId);
              
              // Trigger immediate sidebar update for animation
              console.log('Triggering sidebar update for animation');
              if (onSessionStatusChange) {
                onSessionStatusChange();
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up session subscription for:', sessionId);
      supabase.removeChannel(channel);
    };
  }, [sessionId, setIsConsultComplete, setDialogDismissed, setHasFeedback, onSessionStatusChange]);

  // Helper function to check if feedback exists for a session
  const checkFeedbackExists = async (sessionId: string) => {
    try {
      console.log('Checking feedback existence for session:', sessionId);
      const { data, error } = await supabase
        .from('feedback')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking feedback existence:', error);
      } else {
        const hasFeedback = !!data;
        console.log('Feedback exists:', hasFeedback);
        setHasFeedback(hasFeedback);
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
