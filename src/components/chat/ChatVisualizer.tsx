
import { useEffect, useState } from "react";
import ThreeScene from "@/components/chat/ThreeScene";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatVisualizerProps {
  isThinking: boolean;
  audioData: number[];
  currentSessionId: string | null;
}

const ChatVisualizer = ({ isThinking, audioData, currentSessionId }: ChatVisualizerProps) => {
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);
  const { autoMessageSent, isProcessing } = useChatMessages(currentSessionId);
  const isMobile = useIsMobile();
  
  // Show welcome animation when a new session is created with auto-message
  // or during any processing state
  useEffect(() => {
    if ((autoMessageSent && isProcessing) || isThinking) {
      setShowWelcomeAnimation(true);
    } else {
      // Small delay before hiding to avoid abrupt transitions
      const timer = setTimeout(() => {
        setShowWelcomeAnimation(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [autoMessageSent, isProcessing, isThinking, currentSessionId]);

  return (
    <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden touch-none">
      <div className={`aspect-square max-w-full max-h-full ${isMobile ? 'w-3/4' : 'w-full'}`}>
        <ThreeScene 
          isThinking={isThinking || showWelcomeAnimation || isProcessing} 
          audioData={audioData} 
        />
      </div>
    </div>
  );
};

export default ChatVisualizer;
