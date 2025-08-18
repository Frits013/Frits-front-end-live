import { motion } from "framer-motion";

interface AnswerBubbleProps {
  answer: string;
  onAnimationComplete?: () => void;
}

const AnswerBubble = ({ answer, onAnimationComplete }: AnswerBubbleProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, x: 100 }}
      transition={{ 
        initial: { duration: 0.2, ease: "easeOut" },
        exit: { duration: 0.4, ease: "easeIn" }
      }}
      onAnimationComplete={(definition) => {
        if (definition === "exit") {
          onAnimationComplete?.();
        }
      }}
      className="bg-primary/90 text-primary-foreground rounded-2xl p-4 shadow-lg backdrop-blur ml-auto max-w-md mt-4"
    >
      <p className="text-base leading-relaxed">{answer}</p>
    </motion.div>
  );
};

export default AnswerBubble;