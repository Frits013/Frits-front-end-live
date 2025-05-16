
import { useEffect, useState } from "react";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { supabase } from "@/integrations/supabase/client";

interface WelcomeAnimationProps {
  currentSessionId: string | null;
}

const WelcomeAnimation = ({ currentSessionId }: WelcomeAnimationProps) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const { autoMessageSent } = useChatMessages(currentSessionId);
  
  useEffect(() => {
    // Show welcome animation when a new session is created
    if (autoMessageSent && currentSessionId) {
      setShowAnimation(true);
      
      // Set up a listener to track backend processing for the auto message
      const channel = supabase
        .channel(`welcome-animation-${currentSessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `session_id=eq.${currentSessionId} AND (role=eq.writer OR role=eq.assistant)`
          },
          () => {
            // When we get a response, hide the animation
            setTimeout(() => {
              setShowAnimation(false);
            }, 1000); // Keep showing for 1 more second after response
          }
        )
        .subscribe();
        
      // Backup timeout in case we miss the database event
      const backupTimer = setTimeout(() => {
        setShowAnimation(false);
      }, 30000); // 30 seconds maximum
      
      return () => {
        supabase.removeChannel(channel);
        clearTimeout(backupTimer);
      };
    }
  }, [autoMessageSent, currentSessionId]);

  // Return null since we don't want any visual animation component
  return null;
};

export default WelcomeAnimation;
