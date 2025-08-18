import { useState, useEffect } from "react";
import { ChatMessage, InterviewPhase } from "@/types/chat";
import InterviewQuestionDisplay from "./InterviewQuestionDisplay";
import InterviewHistoryCarousel from "./InterviewHistoryCarousel";
import InterviewAnswerAnimation from "./InterviewAnswerAnimation";
import InterviewInputCentered from "./InterviewInputCentered";
import { AnimatePresence } from "framer-motion";

interface InterviewModeSwitcherProps {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  currentChatId: string | null;
  setErrorMessage: (error: string | null) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  isThinkingRef: React.MutableRefObject<boolean>;
  currentPhase?: InterviewPhase;
  questionNumber: number;
  maxQuestions: number;
  onSendMessage: (message: string) => Promise<void>;
}

const InterviewModeSwitcher = ({
  messages,
  setMessages,
  currentChatId,
  setErrorMessage,
  isProcessing,
  setIsProcessing,
  isThinkingRef,
  currentPhase,
  questionNumber,
  maxQuestions,
  onSendMessage
}: InterviewModeSwitcherProps) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationData, setAnimationData] = useState<{
    answer: string;
    question: ChatMessage | null;
  }>({ answer: "", question: null });

  // Get the current question (last assistant message)
  const currentQuestion = [...messages]
    .reverse()
    .find(msg => msg.role === 'assistant') || null;

  // Check if there's any history
  const hasHistory = messages.length > 1;

  const handleSendMessage = async (message: string) => {
    try {
      // Show animation with the answer
      setAnimationData({ answer: message, question: currentQuestion });
      setShowAnimation(true);

      // Send the message
      await onSendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      setErrorMessage('Failed to send message. Please try again.');
      // Hide animation on error
      setShowAnimation(false);
    }
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setAnimationData({ answer: "", question: null });
  };

  return (
    <div className="relative h-full">
      {/* Main Interview Display */}
      {!showHistory && (
        <InterviewQuestionDisplay
          currentQuestion={currentQuestion}
          isProcessing={isProcessing}
          onShowHistory={() => setShowHistory(true)}
          hasHistory={hasHistory}
          currentPhase={currentPhase}
          questionNumber={questionNumber}
          maxQuestions={maxQuestions}
        />
      )}

      {/* History Carousel */}
      <AnimatePresence>
        {showHistory && (
          <InterviewHistoryCarousel
            messages={messages}
            onClose={() => setShowHistory(false)}
            currentPhase={currentPhase}
          />
        )}
      </AnimatePresence>

      {/* Answer Animation */}
      <InterviewAnswerAnimation
        answer={animationData.answer}
        question={animationData.question}
        isVisible={showAnimation}
        onAnimationComplete={handleAnimationComplete}
      />

      {/* Input (only show when not in history mode and not animating) */}
      {!showHistory && !showAnimation && (
        <InterviewInputCentered
          onSubmit={handleSendMessage}
          isProcessing={isProcessing}
          disabled={!currentQuestion}
          placeholder={
            currentQuestion 
              ? "Type your answer here..." 
              : "Waiting for next question..."
          }
        />
      )}
    </div>
  );
};

export default InterviewModeSwitcher;