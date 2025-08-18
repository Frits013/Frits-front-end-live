import { useState, useEffect } from "react";
import { ChatMessage, InterviewPhase } from "@/types/chat";
import InterviewQuestionDisplay from "./InterviewQuestionDisplay";
import InterviewHistoryCarousel from "./InterviewHistoryCarousel";
import InterviewAnswerAnimation from "./InterviewAnswerAnimation";
import InterviewInputCentered from "./InterviewInputCentered";
import QuestionCard from "./QuestionCard";
import AnswerBubble from "./AnswerBubble";
import ThinkingIndicator from "./ThinkingIndicator";
import { AnimatePresence, motion } from "framer-motion";

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
  const [answerFlow, setAnswerFlow] = useState<'idle' | 'card' | 'answer' | 'thinking'>('idle');
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [lockedQuestion, setLockedQuestion] = useState<ChatMessage | null>(null);

  // Get the current question (last assistant message)
  const currentQuestion = [...messages]
    .reverse()
    .find(msg => msg.role === 'assistant') || null;

  // Check if there's any history
  const hasHistory = messages.length > 1;

  const handleSendMessage = async (message: string) => {
    if (!currentQuestion) return;
    
    try {
      // Step 1: Lock current question and show as card
      setLockedQuestion(currentQuestion);
      setCurrentAnswer(message);
      setAnswerFlow('card');
      
      // Step 2: Show answer bubble after short delay
      setTimeout(() => {
        setAnswerFlow('answer');
      }, 200);
      
      // Step 3: Send message and show thinking state
      setTimeout(async () => {
        setAnswerFlow('thinking');
        await onSendMessage(message);
      }, 800);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setErrorMessage('Failed to send message. Please try again.');
      // Reset flow on error
      setAnswerFlow('idle');
      setLockedQuestion(null);
      setCurrentAnswer("");
    }
  };

  // Reset answer flow when new question arrives
  useEffect(() => {
    if (currentQuestion && currentQuestion.id !== lockedQuestion?.id && answerFlow !== 'idle') {
      setTimeout(() => {
        setAnswerFlow('idle');
        setLockedQuestion(null);
        setCurrentAnswer("");
      }, 300);
    }
  }, [currentQuestion?.id, lockedQuestion?.id, answerFlow]);

  return (
    <div className="relative h-full">
      {/* Main Interview Display */}
      {!showHistory && answerFlow === 'idle' && (
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

      {/* Answer Flow States */}
      {!showHistory && answerFlow !== 'idle' && (
        <div className="h-full flex flex-col items-center justify-center relative bg-gradient-to-br from-background/95 via-background/85 to-accent/10 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-8 w-full">
            
            {/* Locked Question Card */}
            <AnimatePresence>
              {lockedQuestion && answerFlow === 'card' && (
                <QuestionCard
                  question={lockedQuestion}
                  phase={currentPhase}
                  questionNumber={questionNumber}
                  maxQuestions={maxQuestions}
                />
              )}
            </AnimatePresence>

            {/* Answer Bubble */}
            <AnimatePresence>
              {answerFlow === 'answer' && (
                <AnswerBubble
                  answer={currentAnswer}
                  onAnimationComplete={() => {
                    // Transition happens in handleSendMessage timeout
                  }}
                />
              )}
            </AnimatePresence>

            {/* Thinking Indicator */}
            <AnimatePresence>
              {answerFlow === 'thinking' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-8"
                >
                  <ThinkingIndicator message="Analyzing your response and preparing the next question..." />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
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

      {/* Input (only show when not in history mode and in idle state) */}
      {!showHistory && answerFlow === 'idle' && (
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