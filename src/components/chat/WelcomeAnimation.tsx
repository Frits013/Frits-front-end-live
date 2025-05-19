
import { useEffect, useState } from "react";
import { useChatMessages } from "@/hooks/use-chat-messages";

interface WelcomeAnimationProps {
  currentSessionId: string | null;
}

const WelcomeAnimation = ({ currentSessionId }: WelcomeAnimationProps) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const { autoMessageSent, isProcessing } = useChatMessages(currentSessionId);
  const [prevSessionId, setPrevSessionId] = useState<string | null>(null);
  
  useEffect(() => {
    // Show welcome animation when a new session is created
    // Detect when session ID changes to trigger animation
    if (currentSessionId && currentSessionId !== prevSessionId) {
      setShowAnimation(true);
      setPrevSessionId(currentSessionId);
      
      // Only hide animation when processing is complete
      if (!isProcessing) {
        const timer = setTimeout(() => {
          setShowAnimation(false);
        }, 1000); // Short fade-out time after processing completes
        
        return () => clearTimeout(timer);
      }
    } else if (autoMessageSent) {
      // Original behavior for auto-message processing
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
  }, [currentSessionId, autoMessageSent, isProcessing, prevSessionId]);

  // We return null since we don't want the confetti anymore
  return null;
};

export default WelcomeAnimation;
