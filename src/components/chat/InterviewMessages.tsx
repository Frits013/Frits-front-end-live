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
  demoPhaseData?: {
    currentPhase: InterviewPhase;
    questionCount: number;
    maxQuestions: number;
  };
}

const InterviewMessages = ({ 
  messages, 
  showFinishButton = false, 
  isProcessing = false,
  currentPhase,
  sessionData,
  currentProgress,
  demoPhaseData
}: InterviewMessagesProps) => {
  // Use demo phase data if available, otherwise fall back to session data
  const currentSessionPhase = demoPhaseData?.currentPhase || sessionData?.current_phase || currentPhase || 'introduction';
  
  // Calculate total questions from session phase configs
  const totalQuestions = sessionData?.phase_max_questions ? 
    Object.values(sessionData.phase_max_questions).reduce((a: any, b: any) => Number(a) + Number(b), 0) : 25;
  
  // Calculate actual answered questions (user messages only)
  const userMessages = messages.filter(m => m.role === 'user');
  const answeredQuestions = userMessages.length;
  
  // Use demo phase data if available for more accurate tracking
  const currentPhaseMaxQuestions = demoPhaseData?.maxQuestions || 
    Number(sessionData?.phase_max_questions?.[currentSessionPhase]) || 5;
  
  // Calculate current phase questions - use demo data if available
  const currentPhaseQuestions = demoPhaseData?.questionCount || 
    Math.max(
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
    completedQuestions,
    currentSessionPhase,
    shouldTransition: currentPhaseQuestions >= currentPhaseMaxQuestions
  });

  // Log if we should transition phases
  if (currentPhaseQuestions >= currentPhaseMaxQuestions && currentSessionPhase === 'introduction') {
    console.warn('Introduction phase should transition to theme_selection - 5 questions reached');
  }

  return (
    <div className={`flex flex-col gap-6 p-6 ${showFinishButton ? 'pb-24' : ''}`}>
      {/* Show loading state if no messages and processing */}
      {messages.length === 0 && isProcessing && (
        <div className="flex flex-col items-center justify-center py-16 gap-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg animate-pulse">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Preparing Your Interview
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Frits is getting ready to start your consultation...
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => {
        const isLatest = index === messages.length - 1 && message.role === 'assistant';
        
        // Determine the correct phase for this message based on when it was sent
        let messagePhase: InterviewPhase = 'introduction';
        let messagePhaseProgress = 0;
        let messagePhaseMaxQuestions = 3; // Default to introduction max
        
        if (message.role === 'assistant') {
          // Count user messages up to this point to determine the phase at this message
          const userMessagesUpToHere = messages.slice(0, index).filter(m => m.role === 'user').length;
          
          // Determine phase based on user message count when this message was sent
          if (userMessagesUpToHere <= 3) {
            messagePhase = 'introduction';
            messagePhaseMaxQuestions = 3;
            messagePhaseProgress = userMessagesUpToHere;
          } else if (userMessagesUpToHere <= 7) {
            messagePhase = 'theme_selection';
            messagePhaseMaxQuestions = 4;
            messagePhaseProgress = userMessagesUpToHere - 3; // Questions in this phase
          } else if (userMessagesUpToHere <= 15) {
            messagePhase = 'deep_dive';
            messagePhaseMaxQuestions = 8;
            messagePhaseProgress = userMessagesUpToHere - 7;
          } else if (userMessagesUpToHere <= 17) {
            messagePhase = 'summary';
            messagePhaseMaxQuestions = 2;
            messagePhaseProgress = userMessagesUpToHere - 15;
          } else {
            messagePhase = 'recommendations';
            messagePhaseMaxQuestions = 3;
            messagePhaseProgress = userMessagesUpToHere - 17;
          }
          
          // For the latest message, use current live data if available
          if (isLatest && demoPhaseData) {
            messagePhase = demoPhaseData.currentPhase;
            messagePhaseProgress = demoPhaseData.questionCount;
            messagePhaseMaxQuestions = demoPhaseData.maxQuestions;
          }
        }
        
        return (
          <InterviewCard
            key={message.id}
            message={message}
            isLatest={isLatest}
            phase={messagePhase}
            showProgress={message.role === 'assistant'}
            phaseMaxQuestions={messagePhaseMaxQuestions}
            phaseQuestionNumber={messagePhaseProgress}
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