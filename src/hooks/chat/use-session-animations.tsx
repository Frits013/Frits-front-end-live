
import { useEffect, useState } from "react";

export const useSessionAnimations = (showCompleteButton: boolean) => {
  const [animatingSessionId, setAnimatingSessionId] = useState<string | null>(null);
  const [shouldTriggerAnimation, setShouldTriggerAnimation] = useState(false);

  // Trigger animation when the complete button appears
  useEffect(() => {
    if (showCompleteButton) {
      console.log('Complete button appeared - triggering session animation');
      setShouldTriggerAnimation(true);
      
      // Reset the trigger after animation starts
      const timeout = setTimeout(() => {
        setShouldTriggerAnimation(false);
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [showCompleteButton]);

  const startSessionAnimation = (sessionId: string) => {
    console.log('Starting animation for session:', sessionId);
    setAnimatingSessionId(sessionId);
    
    // Clear animation state after animation completes
    setTimeout(() => {
      setAnimatingSessionId(null);
    }, 800); // Animation duration
  };

  return {
    animatingSessionId,
    shouldTriggerAnimation,
    startSessionAnimation
  };
};
