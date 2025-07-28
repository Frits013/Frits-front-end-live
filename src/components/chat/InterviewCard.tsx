import { ChatMessage } from "@/types/chat";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Bot, CheckCircle, Clock, ChevronRight } from "lucide-react";
import { sanitizeInput } from "@/lib/input-validation";
import DOMPurify from 'dompurify';

interface InterviewCardProps {
  message: ChatMessage;
  isLatest?: boolean;
  questionNumber?: number;
  totalQuestions?: number;
  phase?: string;
  showProgress?: boolean;
}

const InterviewCard = ({
  message,
  isLatest = false,
  questionNumber,
  totalQuestions,
  phase,
  showProgress = false
}: InterviewCardProps) => {
  const formatText = (text: string) => {
    // Sanitize input first
    const sanitized = sanitizeInput(text);
    
    // Handle bold text wrapped in **
    const boldText = sanitized.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Comprehensive sanitization with DOMPurify
    return DOMPurify.sanitize(boldText, {
      ALLOWED_TAGS: ['strong', 'em', 'br'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
      SANITIZE_DOM: true,
      FORBID_ATTR: ['style', 'class', 'onclick', 'onload', 'onerror'],
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input']
    });
  };

  const formatMessage = (message: ChatMessage) => {
    if (!message || !message.content) return '';
    
    let text = message.content;

    // First, handle any markdown list numbers that might appear
    text = text.replace(/^\d+\.\s+/gm, '');

    // Split the text into sections based on ###, but only if ### exists
    if (text.includes('###')) {
      const sections = text.split('###').filter(Boolean);
      return sections.map((section, index) => {
        const [header, ...contentParts] = section.trim().split('\n');
        const content = contentParts.join('\n');

        return (
          <div key={index} className="mb-4 last:mb-0">
            <div className="font-semibold text-base mb-2 text-purple-700 dark:text-purple-300">
              {header.trim()}
            </div>
            <div 
              className="pl-4 border-l-2 border-purple-200 dark:border-purple-700"
              dangerouslySetInnerHTML={{ 
                __html: formatText(content.trim())
              }}
            />
          </div>
        );
      });
    }

    // If there are no ###, treat the entire text as regular content
    return (
      <div 
        className="whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ 
          __html: formatText(text)
        }}
      />
    );
  };

  const getPhaseColor = (phase?: string) => {
    switch (phase?.toLowerCase()) {
      case 'introduction':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'core':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'summary':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'conclusion':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-6">
        <Card className="max-w-[80%] bg-gradient-to-br from-purple-600 to-indigo-600 text-white border-none shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium opacity-90">You</span>
            </div>
            <div className="text-white/95">
              {formatMessage(message)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <Card className={`max-w-[90%] transition-all duration-300 ${
        isLatest 
          ? 'shadow-lg border-purple-200 dark:border-purple-700 bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-900/20' 
          : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm'
      }`}>
        <CardContent className="p-6">
          {/* Header with Frits info and progress */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">Frits</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">AI Consultant</span>
              </div>
            </div>
            
            {showProgress && questionNumber && totalQuestions && (
              <div className="flex items-center gap-2">
                {phase && (
                  <Badge className={`text-xs ${getPhaseColor(phase)}`}>
                    {phase}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {questionNumber} of {totalQuestions}
                </Badge>
              </div>
            )}
          </div>

          {/* Message content */}
          <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {formatMessage(message)}
          </div>

          {/* Footer with status */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <CheckCircle className="w-4 h-4" />
              <span>Delivered</span>
            </div>
            {isLatest && (
              <div className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400">
                <Clock className="w-4 h-4" />
                <span>Awaiting response</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewCard;