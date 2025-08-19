
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const isDev = process.env.NODE_ENV !== 'production';

export const useSessionSubscription = (
  sessionId: string | null, 
  isConsultComplete: boolean, 
  setIsConsultComplete: (isComplete: boolean) => void,
  setDialogDismissed: (dismissed: boolean) => void,
  setHasFeedback: (hasFeedback: boolean) => void
) => {
  const subscriptionRef = useRef<any>(null);
  const initialCheckDoneRef = useRef(false);

  // Helper function to check if feedback exists for a session
  const checkFeedbackExists = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();
      
      if (error) {
        if (isDev) console.error('Error checking feedback existence:', error);
      } else {
        const hasFeedback = !!data;
        setHasFeedback(hasFeedback);
        if (data) {
          setDialogDismissed(true);
        }
      }
    } catch (error) {
      if (isDev) console.error('Error in checkFeedbackExists:', error);
    }
  };

  // Initial state check - only run once per session
  useEffect(() => {
    if (!sessionId || initialCheckDoneRef.current) return;

    const checkInitialState = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('finished')
          .eq('id', sessionId)
          .single();

        if (sessionError) {
          if (isDev) console.error('Error checking session status:', sessionError);
          return;
        }

        if (sessionData) {
          setIsConsultComplete(sessionData.finished);
          
          if (sessionData.finished) {
            setDialogDismissed(false);
            await checkFeedbackExists(sessionId);
          }
        }
      } catch (error) {
        if (isDev) console.error('Error in checkInitialState:', error);
      } finally {
        initialCheckDoneRef.current = true;
      }
    };

    checkInitialState();
  }, [sessionId]);

  // Reset initial check when session changes
  useEffect(() => {
    initialCheckDoneRef.current = false;
  }, [sessionId]);

  // Set up subscription with proper cleanup
  useEffect(() => {
    if (!sessionId) return;

    // Clean up previous subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

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
          const newFinishedStatus = payload.new.finished;
          const oldFinishedStatus = payload.old?.finished;
          
          // Only update if the status actually changed
          if (newFinishedStatus !== oldFinishedStatus) {
            if (isDev) console.log('Session finished status changed to:', newFinishedStatus);
            setIsConsultComplete(newFinishedStatus);
            
            if (newFinishedStatus) {
              setDialogDismissed(false);
              checkFeedbackExists(sessionId);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feedback'
        },
        async (payload) => {
          // Only react to feedback for this session
          if (payload.new.session_id === sessionId) {
            if (isDev) console.log('Feedback added for current session');
            setHasFeedback(true);
            setDialogDismissed(true);
          }
        }
      )
      .subscribe((status) => {
        if (isDev && status !== 'SUBSCRIBED') {
          console.log('Session subscription status:', status);
        }
      });

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [sessionId]);
};
