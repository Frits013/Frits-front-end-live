import { ChatMessage } from "@/types/chat";
import InterviewCard from "./InterviewCard";
import InterviewProgress from "./InterviewProgress";
import InterviewTypingIndicator from "./InterviewTypingIndicator";

interface InterviewMessagesProps {
  messages: ChatMessage[];
  showFinishButton?: boolean;
  isProcessing?: boolean;
  currentPhase?: string;
}

const InterviewMessages = ({ 
  messages, 
  showFinishButton = false, 
  isProcessing = false,
  currentPhase = "Core Questions"
}: InterviewMessagesProps) => {
  // Calculate progress based on messages
  const totalQuestions = 8; // This could be dynamic based on session type
  const answeredQuestions = Math.floor(messages.filter(m => m.role === 'user').length);
  const progress = Math.min((answeredQuestions / totalQuestions) * 100, 100);

  // Determine current phase based on progress
  const getPhase = (progress: number) => {
    if (progress < 25) return 'Introduction';
    if (progress < 50) return 'Core Questions';
    if (progress < 75) return 'Summary';
    return 'Conclusion';
  };

  const phase = getPhase(progress);
  const estimatedTimeLeft = progress < 100 ? `${Math.max(1, Math.ceil((100 - progress) / 10))} min` : undefined;

  return (
    <div className={`flex flex-col gap-6 p-6 ${showFinishButton ? 'pb-24' : ''}`}>
      {/* Messages */}
      {messages.map((message, index) => {
        const isLatest = index === messages.length - 1;
        const questionNumber = message.role === 'assistant' ? 
          Math.floor(messages.slice(0, index + 1).filter(m => m.role === 'assistant').length) : 
          undefined;
        
        return (
          <InterviewCard
            key={message.id}
            message={message}
            isLatest={isLatest && message.role === 'assistant'}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            phase={phase}
            showProgress={message.role === 'assistant'}
          />
        );
      })}

      {/* Typing indicator */}
      {isProcessing && (
        <InterviewTypingIndicator 
          phase={phase}
        />
      )}
    </div>
  );
};

export default InterviewMessages;