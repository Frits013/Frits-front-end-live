import { ChatMessage, InterviewPhase } from "@/types/chat";
import InterviewCard from "./InterviewCard";
import InterviewProgress from "./InterviewProgress";
import InterviewTypingIndicator from "./InterviewTypingIndicator";

interface InterviewMessagesProps {
  messages: ChatMessage[];
  showFinishButton?: boolean;
  isProcessing?: boolean;
  currentPhase?: InterviewPhase;
  sessionData?: any;
  currentProgress?: any;
}

const InterviewMessages = ({ 
  messages, 
  showFinishButton = false, 
  isProcessing = false,
  currentPhase,
  sessionData,
  currentProgress
}: InterviewMessagesProps) => {
  // Use real session data or fallback calculations
  const currentSessionPhase = currentPhase || sessionData?.current_phase || 'introduction';
  const phaseProgressData = currentProgress || {};
  
  // Calculate total questions and progress
  const totalQuestions = sessionData?.phase_max_questions ? 
    Object.values(sessionData.phase_max_questions).reduce((a: any, b: any) => Number(a) + Number(b), 0) : 8;
  const answeredQuestions = Math.floor(messages.filter(m => m.role === 'user').length);
  
  // Get phase-specific data
  const currentPhaseMaxQuestions = Number(sessionData?.phase_max_questions?.[currentSessionPhase]) || 5;
  const currentPhaseQuestions = Number(phaseProgressData?.questions_asked) || 1;
  
  // Calculate overall progress
  const progress = Math.min((answeredQuestions / Number(totalQuestions)) * 100, 100);
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
            totalQuestions={Number(totalQuestions)}
            phase={currentSessionPhase as InterviewPhase}
            showProgress={message.role === 'assistant'}
            phaseProgress={progress}
            phaseMaxQuestions={currentPhaseMaxQuestions}
            phaseQuestionNumber={currentPhaseQuestions}
            sessionData={sessionData}
          />
        );
      })}

      {/* Typing indicator */}
      {isProcessing && (
        <InterviewTypingIndicator 
          phase={currentSessionPhase as InterviewPhase}
        />
      )}
    </div>
  );
};

export default InterviewMessages;