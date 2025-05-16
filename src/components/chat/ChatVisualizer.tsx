
import { useEffect, useState } from "react";
import ThreeScene from "@/components/chat/ThreeScene";
import { useChatMessages } from "@/hooks/use-chat-messages";

interface ChatVisualizerProps {
  isThinking: boolean;
  audioData: number[];
  currentSessionId: string | null;
}

const ChatVisualizer = ({ isThinking, audioData, currentSessionId }: ChatVisualizerProps) => {
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);
  const { autoMessageSent } = useChatMessages(currentSessionId);
  
  // Show welcome animation when a new session is created with auto-message
  useEffect(() => {
    if (autoMessageSent) {
      setShowWelcomeAnimation(true);
      
      // Turn off welcome animation after a few seconds
      const timer = setTimeout(() => {
        setShowWelcomeAnimation(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [autoMessageSent, currentSessionId]);

  return (
    <div className="w-full max-w-[500px] mx-auto mb-8">
      <div className="aspect-square w-full">
        <ThreeScene 
          isThinking={isThinking || showWelcomeAnimation} 
          audioData={audioData} 
        />
      </div>
    </div>
  );
};

export default ChatVisualizer;
