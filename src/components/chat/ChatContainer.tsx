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
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  
  // Add a new state to track whether the complete button is showing
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  
  // Track the default size of the visualizer panel - smaller on mobile
  const [defaultVisualizerSize, setDefaultVisualizerSize] = useState(isMobile ? 25 : 35);

  // Update default size when mobile status changes
  useEffect(() => {
    setDefaultVisualizerSize(isMobile ? 25 : 35);
  }, [isMobile]);

  // Update the button visibility when isConsultComplete changes
  useEffect(() => {
    // Show the button when the session is completed but dialog is not showing
    // and there's no feedback yet and dialog hasn't been dismissed
    if (isConsultComplete && !showCompleteDialog && !hasFeedback && !dialogDismissed) {
      setShowCompleteButton(true);
      
      // When the button appears, scroll to input field to keep it visible
      setTimeout(() => {
        if (inputContainerRef.current) {
          inputContainerRef.current.scrollIntoView({ behavior: isMobile ? 'auto' : 'smooth' });
        }
      }, 100);
    } else {
      setShowCompleteButton(false);
    }
  }, [isConsultComplete, showCompleteDialog, hasFeedback, dialogDismissed, isMobile]);

  // Ensure the input is visible when the component mounts or chat changes
  useEffect(() => {
    // Small delay to allow for rendering
    const timer = setTimeout(() => {
      if (inputContainerRef.current) {
        inputContainerRef.current.scrollIntoView({ behavior: isMobile ? 'auto' : 'smooth' });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentChatId, isMobile]);

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
    <div className="flex-1 flex flex-col h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-purple-900/20">
      <div className="flex-1 overflow-hidden p-2 sm:p-6 flex flex-col">
        <ResizablePanelGroup 
          direction="vertical" 
          className="min-h-[calc(100dvh-3rem)] bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20"
        >
          {/* Visualizer Panel */}
          <ResizablePanel 
            defaultSize={defaultVisualizerSize} 
            minSize={isMobile ? 15 : 20}
            className="flex items-center justify-center bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-t-2xl"
          >
            <ChatVisualizer 
              isThinking={isThinkingRef.current} 
              audioData={audioData}
              currentSessionId={currentChatId}
            />
          </ResizablePanel>
          
          {/* Resizable Handle */}
          <ResizableHandle 
            withHandle 
            className="bg-gradient-to-r from-purple-200 to-indigo-200 dark:from-purple-700 dark:to-indigo-700 h-2 hover:from-purple-300 hover:to-indigo-300 dark:hover:from-purple-600 dark:hover:to-indigo-600 transition-all duration-200 z-10"
          />
          
          {/* Chat Panel */}
          <ResizablePanel defaultSize={100 - defaultVisualizerSize} minSize={isMobile ? 40 : 30}>
            <div className="flex-1 flex flex-col h-full relative overflow-hidden rounded-b-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              
              <ChatMessagesContainer 
                messages={messages} 
                errorMessage={errorMessage} 
              />
              
              {/* Finish Consult Button that appears as a fixed position element */}
              {showCompleteButton && (
                <div className="sticky bottom-[80px] mx-4 mb-2 z-10">
                  <Button 
                    onClick={handleCompleteButtonClick}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white flex items-center justify-center gap-2 py-3 rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-200"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Finish Interview</span>
                  </Button>
                </div>
              )}
              
              <div 
                ref={inputContainerRef} 
                className="sticky bottom-0 z-10"
              >
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
            </div>
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
