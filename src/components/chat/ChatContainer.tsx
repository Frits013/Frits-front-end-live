
import { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import ConsultCompleteDialog from "@/components/chat/ConsultCompleteDialog";
import { useToast } from "@/hooks/use-toast";
import ChatVisualizer from "./ChatVisualizer";
import ChatMessagesContainer from "./ChatMessagesContainer";
import ChatInputContainer from "./ChatInputContainer";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface ChatContainerProps {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  currentChatId: string | null;
  updateChatTitle: (chatId: string, newTitle: string) => Promise<boolean>;
  isConsultComplete: boolean;
  setIsConsultComplete: (isComplete: boolean) => void;
  onConsultFinish: (sessionId: string) => void;
  dialogDismissed: boolean;
  setDialogDismissed: (dismissed: boolean) => void;
  hasFeedback?: boolean;
}

const ChatContainer = ({
  messages,
  setMessages,
  currentChatId,
  updateChatTitle,
  isConsultComplete,
  setIsConsultComplete,
  onConsultFinish,
  dialogDismissed,
  setDialogDismissed,
  hasFeedback = false,
}: ChatContainerProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const isThinkingRef = useRef(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  
  // Add a new state to track whether the complete button is showing
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  
  // Track the default size of the visualizer panel
  const [defaultVisualizerSize, setDefaultVisualizerSize] = useState(40);

  // Update the button visibility when isConsultComplete changes
  useEffect(() => {
    // Show the button when the session is completed but dialog is not showing
    // and there's no feedback yet and dialog hasn't been dismissed
    if (isConsultComplete && !showCompleteDialog && !hasFeedback && !dialogDismissed) {
      setShowCompleteButton(true);
      
      // When the button appears, scroll to input field to keep it visible
      setTimeout(() => {
        if (inputContainerRef.current) {
          inputContainerRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      setShowCompleteButton(false);
    }
  }, [isConsultComplete, showCompleteDialog, hasFeedback, dialogDismissed]);

  // Ensure the input is visible when the component mounts or chat changes
  useEffect(() => {
    // Small delay to allow for rendering
    const timer = setTimeout(() => {
      if (inputContainerRef.current) {
        inputContainerRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentChatId]);

  // Replace the auto-showing dialog effect with button-triggered approach
  const handleCompleteButtonClick = useCallback(() => {
    if (currentChatId) {
      setShowCompleteDialog(true);
      setShowCompleteButton(false); // Hide the button when dialog is shown
    }
  }, [currentChatId]);

  const handleFinishConsult = () => {
    if (currentChatId) {
      // Call onConsultFinish only when the user confirms by clicking "End Session"
      onConsultFinish(currentChatId);
      toast({
        title: "Success",
        description: "Consult session marked as complete",
      });
    }
    setShowCompleteDialog(false);
    setDialogDismissed(true);
  };

  const handleContinueChat = () => {
    setShowCompleteDialog(false);
    setDialogDismissed(true);
  };

  return (
    <div className="flex-1 flex flex-col h-[100dvh] w-full">
      <div className="flex-1 overflow-hidden p-4 flex flex-col">
        <ResizablePanelGroup 
          direction="vertical" 
          className="min-h-[calc(100dvh-2rem)]"
        >
          {/* Visualizer Panel */}
          <ResizablePanel 
            defaultSize={defaultVisualizerSize} 
            minSize={15}
            className="flex items-center justify-center"
          >
            <ChatVisualizer 
              isThinking={isThinkingRef.current} 
              audioData={audioData}
              currentSessionId={currentChatId}
            />
          </ResizablePanel>
          
          {/* Resizable Handle */}
          <ResizableHandle withHandle className="bg-purple-100 dark:bg-purple-900 h-1.5 hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors" />
          
          {/* Chat Panel */}
          <ResizablePanel defaultSize={100 - defaultVisualizerSize} minSize={30}>
            <Card className="flex-1 flex flex-col bg-white/20 backdrop-blur-xl border-purple-100/50 shadow-xl rounded-xl relative overflow-hidden h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-purple-50/30 pointer-events-none" />
              
              <ChatMessagesContainer 
                messages={messages} 
                errorMessage={errorMessage} 
              />
              
              {/* Finish Consult Button that appears as a fixed position element */}
              {showCompleteButton && (
                <div className="sticky bottom-[72px] mx-4 mb-2 z-10">
                  <Button 
                    onClick={handleCompleteButtonClick}
                    className="w-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2 py-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Finish Interview</span>
                  </Button>
                </div>
              )}
              
              <div ref={inputContainerRef} className="sticky bottom-0 z-10 bg-white/50 backdrop-blur-sm">
                <ChatInputContainer
                  messages={messages}
                  setMessages={setMessages}
                  currentChatId={currentChatId}
                  setErrorMessage={setErrorMessage}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                  isThinkingRef={isThinkingRef}
                />
              </div>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <ConsultCompleteDialog
        open={showCompleteDialog}
        onClose={handleContinueChat}
        onFinish={handleFinishConsult}
        sessionId={currentChatId}
      />
    </div>
  );
};

export default ChatContainer;
