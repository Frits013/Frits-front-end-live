
import { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Grip } from "lucide-react";
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
    <div className="flex-1 flex flex-col h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="flex-1 overflow-hidden p-3 sm:p-8 flex flex-col">
        <div className="relative">
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-white/30 to-indigo-100/20 dark:from-purple-900/10 dark:via-gray-900/20 dark:to-indigo-900/10 rounded-3xl transform rotate-1 scale-[1.02] blur-sm"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100/20 via-white/30 to-purple-100/20 dark:from-indigo-900/10 dark:via-gray-900/20 dark:to-purple-900/10 rounded-3xl transform -rotate-1 scale-[1.01] blur-sm"></div>
          
          <ResizablePanelGroup 
            direction="vertical" 
            className="relative min-h-[calc(100dvh-4rem)] bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/30 overflow-hidden transform transition-all duration-300 hover:shadow-purple-500/10 hover:scale-[1.002]"
          >
            {/* Visualizer Panel */}
            <ResizablePanel 
              defaultSize={defaultVisualizerSize} 
              minSize={isMobile ? 15 : 20}
              className="flex items-center justify-center bg-gradient-to-br from-purple-50/80 via-white/40 to-indigo-50/80 dark:from-purple-900/30 dark:via-gray-900/40 dark:to-indigo-900/30 rounded-t-3xl relative overflow-hidden"
            >
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-transparent to-indigo-500 transform rotate-12 scale-150"></div>
              </div>
              
              <ChatVisualizer 
                isThinking={isThinkingRef.current} 
                audioData={audioData}
                currentSessionId={currentChatId}
              />
            </ResizablePanel>
            
            {/* Enhanced Resizable Handle with Drag Indicator */}
            <ResizableHandle className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-200/80 via-indigo-200/80 to-purple-200/80 dark:from-purple-700/60 dark:via-indigo-700/60 dark:to-purple-700/60 transition-all duration-300 group-hover:from-purple-300/90 group-hover:via-indigo-300/90 group-hover:to-purple-300/90 dark:group-hover:from-purple-600/70 dark:group-hover:via-indigo-600/70 dark:group-hover:to-purple-600/70"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-white/60 dark:bg-gray-900/60 rounded-full shadow-sm"></div>
                  <div className="p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-sm border border-white/40 dark:border-gray-700/40 opacity-60 group-hover:opacity-100 transition-all duration-300">
                    <Grip className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="w-8 h-1 bg-white/60 dark:bg-gray-900/60 rounded-full shadow-sm"></div>
                </div>
              </div>
            </ResizableHandle>
            
            {/* Chat Panel */}
            <ResizablePanel defaultSize={100 - defaultVisualizerSize} minSize={isMobile ? 40 : 30}>
              <div className="flex-1 flex flex-col h-full relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-white/95 via-white/85 to-purple-50/30 dark:from-gray-900/95 dark:via-gray-900/85 dark:to-purple-900/30 backdrop-blur-xl">
                
                {/* Subtle inner glow */}
                <div className="absolute inset-0 rounded-b-3xl shadow-inner pointer-events-none"></div>
                
                <ChatMessagesContainer 
                  messages={messages} 
                  errorMessage={errorMessage}
                  currentSessionId={currentChatId}
                />
                
                {/* Enhanced Finish Consult Button */}
                {showCompleteButton && (
                  <div className="sticky bottom-[80px] mx-4 mb-2 z-10">
                    <div className="relative">
                      {/* Button glow effect */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl blur-lg opacity-25 group-hover:opacity-40 transition duration-300"></div>
                      
                      <Button 
                        onClick={handleCompleteButtonClick}
                        className="relative w-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white flex items-center justify-center gap-3 py-4 rounded-xl shadow-lg hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-[1.02] border border-green-400/20"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Finish Interview</span>
                      </Button>
                    </div>
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
