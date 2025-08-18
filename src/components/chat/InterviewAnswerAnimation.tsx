import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/types/chat";

interface InterviewAnswerAnimationProps {
  answer: string;
  question: ChatMessage | null;
  isVisible: boolean;
  onAnimationComplete: () => void;
}

const InterviewAnswerAnimation = ({
  answer,
  question,
  isVisible,
  onAnimationComplete
}: InterviewAnswerAnimationProps) => {
  const [stage, setStage] = useState<'appearing' | 'exiting'>('appearing');

  useEffect(() => {
    if (isVisible && answer) {
      // Start with appearing stage
      setStage('appearing');
      
      // Brief pause then start exit
      const exitTimer = setTimeout(() => {
        setStage('exiting');
      }, 800);

      // Complete the animation
      const completeTimer = setTimeout(() => {
        onAnimationComplete();
      }, 1300);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, answer, onAnimationComplete]);

  if (!isVisible || !answer || !question) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Question (stays visible and clean) */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-4xl px-8 text-center"
            >
              <div className="text-lg md:text-xl lg:text-2xl leading-relaxed text-foreground/80">
                {question.content}
              </div>
            </motion.div>

            {/* Answer (simplified animation) */}
            <motion.div
              initial={{ 
                opacity: 0,
                scale: 0.9,
                x: "-50%",
                y: "80vh"
              }}
              animate={{
                opacity: stage === 'exiting' ? 0 : 1,
                scale: 1,
                x: "-50%",
                y: stage === 'exiting' ? "-20vh" : "65vh"
              }}
              transition={{
                duration: stage === 'exiting' ? 0.5 : 0.4,
                ease: stage === 'exiting' ? [0.4, 0, 1, 1] : [0, 0, 0.2, 1]
              }}
              className="absolute left-1/2 bg-gradient-to-br from-accent/95 to-accent backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-2xl"
            >
              <div className="p-6 text-center">
                <div className="text-sm font-medium text-accent-foreground/80 mb-2">
                  Your Answer
                </div>
                <div className="text-lg text-accent-foreground leading-relaxed">
                  {answer}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InterviewAnswerAnimation;