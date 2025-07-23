
import { useEffect, useState } from "react";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2, Brain, MessageSquare } from "lucide-react";

interface ChatVisualizerProps {
  isThinking: boolean;
  audioData: number[];
  currentSessionId: string | null;
}

const ChatVisualizer = ({ isThinking, audioData, currentSessionId }: ChatVisualizerProps) => {
  const { autoMessageSent, isProcessing } = useChatMessages(currentSessionId);
  const isMobile = useIsMobile();
  
  const shouldShowThinking = isThinking || isProcessing;

  return (
    <div className="w-full h-32 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        {shouldShowThinking ? (
          <>
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="h-8 w-8 text-primary/60" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">Frits is thinking...</p>
              <p className="text-sm text-muted-foreground">Processing your response</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">Ready to continue</p>
              <p className="text-sm text-muted-foreground">Share your thoughts</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatVisualizer;
