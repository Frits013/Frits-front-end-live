import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage, InterviewPhase } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, MessageSquare, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import DOMPurify from "dompurify";

interface InterviewHistoryCarouselProps {
  messages: ChatMessage[];
  onClose: () => void;
  currentPhase?: InterviewPhase;
}

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

const InterviewHistoryCarousel = ({
  messages,
  onClose,
  currentPhase
}: InterviewHistoryCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Create Q&A pairs from messages
  const qaPairs = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'assistant') {
      const question = messages[i];
      const answer = messages[i + 1]?.role === 'user' ? messages[i + 1] : null;
      qaPairs.push({ question, answer });
    }
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % qaPairs.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + qaPairs.length) % qaPairs.length);
  };

  const currentPair = qaPairs[currentIndex];

  if (!currentPair) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-background rounded-2xl border shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Interview History</h2>
              <p className="text-sm text-muted-foreground">
                Question {currentIndex + 1} of {qaPairs.length}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="rounded-full w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Carousel Content */}
        <div className="p-6 min-h-[400px] max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Question */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <MessageSquare className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-primary mb-2">Question</div>
                      <div 
                        className="text-foreground leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: DOMPurify.sanitize(formatMessage(currentPair.question), { 
                            ALLOWED_TAGS: ['strong', 'em', 'br'] 
                          })
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Answer */}
              {currentPair.answer ? (
                <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-4 h-4 text-accent-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-accent-foreground mb-2">Your Answer</div>
                        <div className="text-foreground leading-relaxed">
                          {currentPair.answer.content}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-muted/50 border-dashed border-muted-foreground/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Answer pending</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 border-t bg-muted/20">
          <Button
            onClick={goToPrevious}
            variant="outline"
            disabled={qaPairs.length <= 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {/* Indicators */}
          <div className="flex gap-2">
            {qaPairs.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-primary w-6' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={goToNext}
            variant="outline"
            disabled={qaPairs.length <= 1}
            className="gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InterviewHistoryCarousel;