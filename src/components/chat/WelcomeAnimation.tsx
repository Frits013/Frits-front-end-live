
import { useEffect, useState } from "react";
import { useChatMessages } from "@/hooks/use-chat-messages";
import Confetti from "@/components/ui/confetti";

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
        }, 3000); // Longer display time for better visibility
        
        return () => clearTimeout(timer);
      }
    } else if (autoMessageSent) {
      // Original behavior for auto-message processing
      setShowAnimation(true);
      
      // Only hide animation when processing is complete
      if (!isProcessing) {
        const timer = setTimeout(() => {
          setShowAnimation(false);
        }, 3000); // Longer display time for better visibility
        
        return () => clearTimeout(timer);
      }
    } else {
      // If no auto message or processing complete, don't show animation
      if (!isProcessing) {
        setShowAnimation(false);
      }
    }
  }, [currentSessionId, autoMessageSent, isProcessing, prevSessionId]);

  // Return the Confetti component to show the animation
  return <Confetti active={showAnimation} />;
};

export default WelcomeAnimation;
