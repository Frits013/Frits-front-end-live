import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "@/components/ui/confetti";

interface InterviewThankYouProps {
  show: boolean;
  onComplete: () => void;
}

const InterviewThankYou = ({ show, onComplete }: InterviewThankYouProps) => {
  const [currentMessage, setCurrentMessage] = useState<'thank-you' | 'made-by'>('thank-you');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (show) {
      // Start confetti immediately
      setShowConfetti(true);
      
      // After 4 seconds, switch to "made by FIDDS" message
      const timer = setTimeout(() => {
        setCurrentMessage('made-by');
      }, 4000);
      
      // Stop confetti after 6 seconds total
      const confettiTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 6000);

      return () => {
        clearTimeout(timer);
        clearTimeout(confettiTimer);
      };
    } else {
      setShowConfetti(false);
      setCurrentMessage('thank-you');
    }
  }, [show]);

  if (!show) return null;

  return (
    <>
      {/* Full-screen overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center"
      >
        <div className="text-center">
          <AnimatePresence mode="wait">
            {currentMessage === 'thank-you' ? (
              <motion.div
                key="thank-you"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center"
              >
                <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
                  Thank you for completing this interview!
                </h1>
              </motion.div>
            ) : (
              <motion.div
                key="made-by"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center space-y-6"
              >
                <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                  made by FIDDS
                </h2>
                <motion.img
                  src="/lovable-uploads/aacf68b0-e0c4-472e-9f50-8289a498979b.png"
                  alt="FIDDS Company Emblem"
                  className="h-16 md:h-24 w-auto"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Confetti Animation */}
      <Confetti active={showConfetti} />
    </>
  );
};

export default InterviewThankYou;
