import { ChatMessage, InterviewPhase, InterviewProgress } from "@/types/chat";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, Bot, CheckCircle, Clock, ChevronRight, MessageCircle, Target, Brain, FileText, Award } from "lucide-react";
import { sanitizeInput } from "@/lib/input-validation";
import DOMPurify from 'dompurify';
interface InterviewCardProps {
  message: ChatMessage;
  isLatest?: boolean;
  questionNumber?: number;
  totalQuestions?: number;
  phase?: InterviewPhase;
  showProgress?: boolean;
  phaseProgress?: number;
  phaseMaxQuestions?: number;
  phaseQuestionNumber?: number;
  sessionData?: any;
}
const InterviewCard = ({
  message,
  isLatest = false,
  questionNumber,
  totalQuestions,
  phase,
  showProgress = false,
  phaseProgress = 0,
  phaseMaxQuestions = 5,
  phaseQuestionNumber = 1,
  sessionData
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
        return <div key={index} className="mb-4 last:mb-0">
            <div className="font-semibold text-base mb-2 text-purple-700 dark:text-purple-300">
              {header.trim()}
            </div>
            <div className="pl-4 border-l-2 border-purple-200 dark:border-purple-700" dangerouslySetInnerHTML={{
            __html: formatText(content.trim())
          }} />
          </div>;
      });
    }

    // If there are no ###, treat the entire text as regular content
    return <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
      __html: formatText(text)
    }} />;
  };
  const getPhaseIcon = (phase?: InterviewPhase) => {
    switch (phase) {
      case 'introduction':
        return MessageCircle;
      case 'theme_selection':
        return Target;
      case 'deep_dive':
        return Brain;
      case 'summary':
        return FileText;
      case 'recommendations':
        return Award;
      default:
        return Bot;
    }
  };
  const getPhaseColor = (phase?: InterviewPhase) => {
    switch (phase) {
      case 'introduction':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
      case 'theme_selection':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800';
      case 'deep_dive':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800';
      case 'summary':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800';
      case 'recommendations':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800';
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
  if (message.role === 'user') {
    return <div className="flex justify-end mb-8 animate-fade-in">
        <Card className="max-w-[85%] border-none shadow-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">Your Response</div>
                
              </div>
            </div>
            <div className="text-white leading-relaxed">
              {formatMessage(message)}
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  const PhaseIcon = getPhaseIcon(phase);
  const phasePercentage = phaseMaxQuestions > 0 ? Math.min(phaseQuestionNumber / phaseMaxQuestions * 100, 100) : 0;
  return <div className="mb-8 animate-fade-in">
      <Card className={`max-w-[95%] transition-all duration-500 shadow-xl border-0 ${isLatest ? 'bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/30 ring-2 ring-blue-200/40 dark:ring-blue-800/40' : 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm'}`}>
        <CardContent className="p-8">
          {/* Enhanced Header with Interview Context */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-lg text-gray-900 dark:text-white">Frits</span>
                  <Badge variant="secondary" className="text-xs px-2 py-1">AI Consultant</Badge>
                </div>
                
              </div>
            </div>
            
            {showProgress && phase && <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <PhaseIcon className="w-4 h-4 text-gray-500" />
                  <Badge className={`text-xs border ${getPhaseColor(phase)}`}>
                    {getPhaseTitle(phase)}
                  </Badge>
                </div>
              </div>}
          </div>

          {/* Phase Progress Indicator */}
          {showProgress && phase && phaseMaxQuestions > 0 && <div className="mb-6 p-4 rounded-lg bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PhaseIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {getPhaseTitle(phase)} Progress
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {phaseQuestionNumber} / {phaseMaxQuestions} questions
                </span>
              </div>
              <Progress value={phasePercentage} className="h-2" />
            </div>}

          {/* Enhanced Message Content */}
          <div className="text-gray-800 dark:text-gray-200 leading-relaxed text-[15px]">
            {formatMessage(message)}
          </div>

          {/* Enhanced Footer */}
          
        </CardContent>
      </Card>
    </div>;
};
export default InterviewCard;