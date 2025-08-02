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
  // Use real session data - prioritize database values
  const currentSessionPhase = sessionData?.current_phase || currentPhase || 'introduction';
  
  // Calculate total questions from session phase configs
  const totalQuestions = sessionData?.phase_max_questions ? 
    Object.values(sessionData.phase_max_questions).reduce((a: any, b: any) => Number(a) + Number(b), 0) : 25;
  
  // Calculate actual answered questions (user messages only)
  const userMessages = messages.filter(m => m.role === 'user');
  const answeredQuestions = userMessages.length;
  
  // Get current phase data from session
  const currentPhaseMaxQuestions = Number(sessionData?.phase_max_questions?.[currentSessionPhase]) || 5;
  
  // Calculate current phase questions - prioritize actual user messages over database value
  const currentPhaseQuestions = Math.max(
    Number(currentProgress?.questions_asked) || 0,
    userMessages.length // Use actual user message count as fallback
  );
  
  // Calculate progress for completed phases
  const phaseOrder = ['introduction', 'theme_selection', 'deep_dive', 'summary', 'recommendations'];
  const currentPhaseIndex = phaseOrder.indexOf(currentSessionPhase);
  
  let completedQuestions = 0;
  for (let i = 0; i < currentPhaseIndex; i++) {
    const phaseName = phaseOrder[i];
    completedQuestions += Number(sessionData?.phase_max_questions?.[phaseName]) || 5;
  }
  
  // Add current phase questions
  completedQuestions += Math.min(currentPhaseQuestions, currentPhaseMaxQuestions);
  
  // Calculate overall progress percentage
  const overallProgress = Math.min((completedQuestions / Number(totalQuestions)) * 100, 100);
  
  // Calculate current phase progress percentage
  const phaseProgress = currentPhaseMaxQuestions > 0 ? 
    Math.min((currentPhaseQuestions / currentPhaseMaxQuestions) * 100, 100) : 0;
  
  console.log('Debug - Progress values:', {
    overallProgress,
    phaseProgress,
    currentPhaseQuestions,
    currentPhaseMaxQuestions,
    totalQuestions,
    completedQuestions
  });

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
            phaseProgress={phaseProgress}
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