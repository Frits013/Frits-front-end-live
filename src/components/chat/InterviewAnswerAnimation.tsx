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
  const [stage, setStage] = useState<'entering' | 'attached' | 'exiting'>('entering');

  useEffect(() => {
    if (isVisible && answer) {
      // Start the animation sequence
      setStage('entering');
      
      // Move to attached stage after entry animation
      const attachTimer = setTimeout(() => {
        setStage('attached');
      }, 800);

      // Start exit animation
      const exitTimer = setTimeout(() => {
        setStage('exiting');
      }, 2000);

      // Complete the animation
      const completeTimer = setTimeout(() => {
        onAnimationComplete();
      }, 3200);

      return () => {
        clearTimeout(attachTimer);
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
            {/* Question (stationary in center) */}
            <motion.div
              initial={{ opacity: 0.7 }}
              animate={{ opacity: stage === 'attached' ? 0.3 : 0.7 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-4xl px-8 text-center"
            >
              <div className="text-lg md:text-xl lg:text-2xl leading-relaxed text-foreground/60">
                {question.content}
              </div>
            </motion.div>

            {/* Answer (animated) */}
            <motion.div
              initial={{ 
                opacity: 0,
                scale: 0.8,
                x: "-50%",
                y: "100vh"
              }}
              animate={{
                opacity: 1,
                scale: stage === 'attached' ? 0.9 : 1,
                x: "-50%",
                y: stage === 'entering' 
                  ? "20vh" 
                  : stage === 'attached' 
                    ? "15vh" 
                    : "-120vh"
              }}
              transition={{
                duration: stage === 'entering' ? 0.8 : stage === 'attached' ? 0.3 : 1.2,
                ease: stage === 'exiting' ? "easeIn" : "easeOut"
              }}
              className="absolute left-1/2 bg-gradient-to-br from-accent/90 to-accent backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-2xl"
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

            {/* Connection line animation */}
            {stage === 'attached' && (
              <motion.div
                initial={{ 
                  height: 0,
                  opacity: 0
                }}
                animate={{ 
                  height: "15vh",
                  opacity: 0.3
                }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="absolute left-1/2 top-1/2 w-0.5 bg-gradient-to-b from-primary/50 to-accent/50 transform -translate-x-1/2"
                style={{ transformOrigin: "top center" }}
              />
            )}

            {/* Particle effects */}
            {stage === 'attached' && (
              <div className="absolute inset-0">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      opacity: 0,
                      scale: 0,
                      x: "50vw",
                      y: "35vh"
                    }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      x: `${50 + (Math.random() - 0.5) * 40}vw`,
                      y: `${35 + (Math.random() - 0.5) * 40}vh`
                    }}
                    transition={{
                      duration: 1,
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                    className="absolute w-2 h-2 bg-primary/60 rounded-full"
                  />
                ))}
              </div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InterviewAnswerAnimation;