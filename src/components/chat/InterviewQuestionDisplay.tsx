import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage, InterviewPhase } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { History, Brain, MessageSquare, Target, BookOpen, Lightbulb } from "lucide-react";
import DOMPurify from "dompurify";

interface InterviewQuestionDisplayProps {
  currentQuestion: ChatMessage | null;
  isProcessing: boolean;
  onShowHistory: () => void;
  hasHistory: boolean;
  currentPhase?: InterviewPhase;
  questionNumber: number;
  maxQuestions: number;
}

const getPhaseIcon = (phase?: InterviewPhase) => {
  switch (phase) {
    case 'introduction':
      return <MessageSquare className="w-5 h-5" />;
    case 'theme_selection':
      return <Target className="w-5 h-5" />;
    case 'deep_dive':
      return <Brain className="w-5 h-5" />;
    case 'summary':
      return <BookOpen className="w-5 h-5" />;
    case 'recommendations':
      return <Lightbulb className="w-5 h-5" />;
    default:
      return <MessageSquare className="w-5 h-5" />;
  }
};

const getPhaseTitle = (phase?: InterviewPhase) => {
  switch (phase) {
    case 'introduction':
      return 'Introduction';
    case 'theme_selection':
      return 'Theme Selection';
    case 'deep_dive':
      return 'Deep Dive';
    case 'summary':
      return 'Summary';
    case 'recommendations':
      return 'Recommendations';
    default:
      return 'Interview';
  }
};

const getPhaseColor = (phase?: InterviewPhase) => {
  switch (phase) {
    case 'introduction':
      return 'text-blue-600 dark:text-blue-400';
    case 'theme_selection':
      return 'text-purple-600 dark:text-purple-400';
    case 'deep_dive':
      return 'text-green-600 dark:text-green-400';
    case 'summary':
      return 'text-orange-600 dark:text-orange-400';
    case 'recommendations':
      return 'text-pink-600 dark:text-pink-400';
    default:
      return 'text-primary';
  }
};

const formatMessage = (message: ChatMessage) => {
  const sections = message.content.split('###');
  
  return sections.map((section, index) => {
    if (index === 0) {
      return section.trim();
    }
    
    const lines = section.trim().split('\n');
    const title = lines[0]?.trim();
    const content = lines.slice(1).join('\n').trim();
    
    if (title && content) {
      return `<strong>${title}</strong><br/>${content}`;
    }
    
    return section.trim();
  }).join('<br/><br/>');
};

const InterviewQuestionDisplay = ({
  currentQuestion,
  isProcessing,
  onShowHistory,
  hasHistory,
  currentPhase,
  questionNumber,
  maxQuestions
}: InterviewQuestionDisplayProps) => {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [displayedQuestions, setDisplayedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentQuestion && !isProcessing) {
      const formattedContent = formatMessage(currentQuestion);
      const sanitizedContent = DOMPurify.sanitize(formattedContent, { 
        ALLOWED_TAGS: ['strong', 'em', 'br'] 
      });
      
      // Check if this question was already displayed
      if (displayedQuestions.has(currentQuestion.id)) {
        // Show immediately without animation
        setDisplayText(sanitizedContent);
        setIsTyping(false);
        return;
      }
      
      // New question - start typing animation
      setDisplayText("");
      setIsTyping(true);
      
      let index = 0;
      const timer = setInterval(() => {
        if (index < sanitizedContent.length) {
          setDisplayText(sanitizedContent.slice(0, index + 1));
          index++;
        } else {
          setIsTyping(false);
          clearInterval(timer);
          // Mark this question as displayed
          setDisplayedQuestions(prev => new Set(prev).add(currentQuestion.id));
        }
      }, 70); // Slower animation: 70ms instead of 20ms
      
      return () => clearInterval(timer);
    }
  }, [currentQuestion, isProcessing, displayedQuestions]);

  return (
    <div className="h-full flex flex-col items-center justify-center relative bg-gradient-to-br from-background/95 via-background/85 to-accent/10 backdrop-blur-xl">
      {/* History Button */}
      {hasHistory && (
        <Button
          onClick={onShowHistory}
          variant="outline"
          size="sm"
          className="absolute top-6 right-6 gap-2 hover:scale-105 transition-transform"
        >
          <History className="w-4 h-4" />
          View History
        </Button>
      )}

      {/* Phase Indicator */}
      {currentPhase && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`absolute top-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 ${getPhaseColor(currentPhase)}`}
        >
          {getPhaseIcon(currentPhase)}
          <span className="text-sm font-medium">
            {getPhaseTitle(currentPhase)} - Question {questionNumber}/{maxQuestions}
          </span>
        </motion.div>
      )}

      {/* Main Question Display */}
      <div className="max-w-4xl mx-auto px-8 text-center">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -50 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative"
            >
              {/* Question Content */}
              <div 
                className="text-lg md:text-xl lg:text-2xl leading-relaxed text-foreground/90 mb-8"
                dangerouslySetInnerHTML={{ __html: displayText }}
              />
              
              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="inline-block w-3 h-6 bg-primary ml-1"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing State */}
        {isProcessing && !currentQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ 
                    duration: 0.6, 
                    repeat: Infinity, 
                    delay: i * 0.2 
                  }}
                  className="w-3 h-3 bg-primary rounded-full"
                />
              ))}
            </div>
            <p className="text-lg text-muted-foreground">
              Preparing your next question...
            </p>
          </motion.div>
        )}

        {/* No Question State */}
        {!currentQuestion && !isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <p className="text-xl text-muted-foreground mb-4">
              Ready to begin your interview
            </p>
            <p className="text-sm text-muted-foreground">
              Your first question will appear here shortly
            </p>
          </motion.div>
        )}
      </div>

      {/* Subtle background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default InterviewQuestionDisplay;