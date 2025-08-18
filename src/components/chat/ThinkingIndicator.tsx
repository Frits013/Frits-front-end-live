import { motion } from "framer-motion";

interface ThinkingIndicatorProps {
  message?: string;
}

const ThinkingIndicator = ({ message = "Analyzing your response..." }: ThinkingIndicatorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center py-8 min-h-[120px]"
    >
      {/* Thinking animation */}
      <div className="flex gap-2 mb-4">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -8, 0] }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity, 
              delay: i * 0.2,
              ease: "easeInOut"
            }}
            className="w-3 h-3 bg-primary/60 rounded-full"
          />
        ))}
      </div>
      
      <p className="text-muted-foreground text-center">{message}</p>
    </motion.div>
  );
};

export default ThinkingIndicator;