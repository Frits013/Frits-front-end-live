
import { useEffect, useState } from "react";
import { useChatMessages } from "@/hooks/use-chat-messages";

interface WelcomeAnimationProps {
  currentSessionId: string | null;
}

const WelcomeAnimation = ({ currentSessionId }: WelcomeAnimationProps) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const { autoMessageSent } = useChatMessages(currentSessionId);
  
  useEffect(() => {
    // Show welcome animation when a new session is created
    if (autoMessageSent) {
      setShowAnimation(true);
      
      // Hide animation after a few seconds
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [autoMessageSent]);

  // Return null since we don't want any visual animation component
  return null;
};

export default WelcomeAnimation;
