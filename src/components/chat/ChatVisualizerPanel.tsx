
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
  currentSessionId,
}: ChatVisualizerPanelProps) => {
  return (
    <ResizablePanel defaultSize={defaultSize} minSize={minSize}>
      <div className="h-full overflow-hidden rounded-t-3xl bg-gradient-to-br from-purple-50/30 via-white/20 to-indigo-50/30 dark:from-purple-900/20 dark:via-gray-900/10 dark:to-indigo-900/20 relative">
        <ChatVisualizer 
          isThinking={isThinking}
          audioData={audioData}
          currentSessionId={currentSessionId}
        />
      </div>
    </ResizablePanel>
  );
};

export default ChatVisualizerPanel;
