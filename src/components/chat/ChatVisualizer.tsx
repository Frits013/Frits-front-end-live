
import ThreeScene from "@/components/chat/ThreeScene";

interface ChatVisualizerProps {
  isThinking: boolean;
  audioData: number[];
}

const ChatVisualizer = ({ isThinking, audioData }: ChatVisualizerProps) => {
  return (
    <div className="w-full max-w-[500px] mx-auto mb-8">
      <div className="aspect-square w-full">
        <ThreeScene isThinking={isThinking} audioData={audioData} />
      </div>
    </div>
  );
};

export default ChatVisualizer;
