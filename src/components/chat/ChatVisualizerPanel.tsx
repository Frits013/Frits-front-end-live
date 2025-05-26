
import { ResizablePanel } from "@/components/ui/resizable";
import ChatVisualizer from "./ChatVisualizer";

interface ChatVisualizerPanelProps {
  defaultSize: number;
  minSize: number;
  isThinking: boolean;
  audioData: number[];
  currentSessionId: string | null;
}

const ChatVisualizerPanel = ({ 
  defaultSize, 
  minSize, 
  isThinking, 
  audioData, 
  currentSessionId 
}: ChatVisualizerPanelProps) => {
  return (
    <ResizablePanel 
      defaultSize={defaultSize} 
      minSize={minSize}
      className="flex items-center justify-center bg-gradient-to-br from-purple-50/80 via-white/40 to-indigo-50/80 dark:from-purple-900/30 dark:via-gray-900/40 dark:to-indigo-900/30 rounded-t-3xl relative overflow-hidden"
    >
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-transparent to-indigo-500 transform rotate-12 scale-150"></div>
      </div>
      
      <ChatVisualizer 
        isThinking={isThinking} 
        audioData={audioData}
        currentSessionId={currentSessionId}
      />
    </ResizablePanel>
  );
};

export default ChatVisualizerPanel;
