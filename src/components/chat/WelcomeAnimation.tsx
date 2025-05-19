
import { useEffect, useState } from "react";
import { useChatMessages } from "@/hooks/use-chat-messages";

interface WelcomeAnimationProps {
  currentSessionId: string | null;
}

const WelcomeAnimation = ({ currentSessionId }: WelcomeAnimationProps) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const { autoMessageSent, isProcessing } = useChatMessages(currentSessionId);
  
  useEffect(() => {
    // Show welcome animation when a new session is created
    if (autoMessageSent) {
      setShowAnimation(true);
      
      // Only hide animation when processing is complete
      if (!isProcessing) {
        const timer = setTimeout(() => {
          setShowAnimation(false);
        }, 1000); // Short fade-out time after processing completes
        
        return () => clearTimeout(timer);
      }
    } else {
      // If no auto message or processing complete, don't show animation
      if (!isProcessing) {
        setShowAnimation(false);
      }
    }
  }, [autoMessageSent, isProcessing]);

  // We return null since we don't want the confetti anymore
  return null;
};

export default WelcomeAnimation;
