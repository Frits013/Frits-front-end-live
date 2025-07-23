
interface ChatVisualizerProps {
  isThinking: boolean;
  audioData: number[];
  currentSessionId: string | null;
}

const ChatVisualizer = ({ isThinking, audioData, currentSessionId }: ChatVisualizerProps) => {
  return (
    <div className="w-full h-32 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Interview in progress</p>
      </div>
    </div>
  );
};

export default ChatVisualizer;
