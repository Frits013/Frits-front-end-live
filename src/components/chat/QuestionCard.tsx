import { motion } from "framer-motion";
import { ChatMessage, InterviewPhase } from "@/types/chat";
import DOMPurify from "dompurify";

interface QuestionCardProps {
  question: ChatMessage;
  phase?: InterviewPhase;
  questionNumber: number;
  maxQuestions: number;
}

const formatMessage = (message: ChatMessage) => {
  const sections = message.content.split('###');
  
  return sections.map((section, index) => {
    if (index === 0) {
      return section.trim().replace(/\n\n/g, '</p><p class="mb-4">').replace(/^\s*/, '<p class="mb-4">') + '</p>';
    }
    
    const lines = section.trim().split('\n');
    const title = lines[0]?.trim();
    const content = lines.slice(1).join('\n').trim();
    
    if (title && content) {
      return `<div class="mb-6"><h3 class="font-semibold text-lg mb-2 text-primary">${title}</h3><p class="text-base leading-relaxed">${content}</p></div>`;
    }
    
    return `<p class="mb-4">${section.trim()}</p>`;
  }).join('');
};

const QuestionCard = ({ question, phase, questionNumber, maxQuestions }: QuestionCardProps) => {
  const formattedContent = formatMessage(question);
  const sanitizedContent = DOMPurify.sanitize(formattedContent, { 
    ALLOWED_TAGS: ['p', 'div', 'h3', 'strong', 'em', 'br'],
    ALLOWED_ATTR: ['class']
  });

  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{ scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-background/90 backdrop-blur border border-border/50 rounded-2xl p-6 shadow-lg min-h-[120px] relative"
    >
      {/* Phase indicator */}
      {phase && (
        <div className="absolute top-4 right-4 text-xs text-muted-foreground bg-accent/20 px-2 py-1 rounded-full">
          {questionNumber}/{maxQuestions}
        </div>
      )}
      
      {/* Question content */}
      <div 
        className="text-base leading-relaxed text-foreground/90"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </motion.div>
  );
};

export default QuestionCard;