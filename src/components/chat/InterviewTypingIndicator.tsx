import { Card, CardContent } from "@/components/ui/card";
import { Bot, Brain, Lightbulb } from "lucide-react";

interface InterviewTypingIndicatorProps {
  message?: string;
  phase?: string;
}

const InterviewTypingIndicator = ({ 
  message = "Frits is thinking about your response...", 
  phase 
}: InterviewTypingIndicatorProps) => {
  const getThinkingMessage = (phase?: string) => {
    switch (phase?.toLowerCase()) {
      case 'introduction':
        return "Frits is preparing to get to know you better...";
      case 'core':
        return "Frits is analyzing your response and preparing the next question...";
      case 'summary':
        return "Frits is summarizing your consultation...";
      case 'conclusion':
        return "Frits is preparing your final recommendations...";
      default:
        return message;
    }
  };

  const getIcon = (phase?: string) => {
    switch (phase?.toLowerCase()) {
      case 'introduction':
        return <Bot className="w-4 h-4" />;
      case 'core':
        return <Brain className="w-4 h-4" />;
      case 'summary':
        return <Lightbulb className="w-4 h-4" />;
      case 'conclusion':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  return (
    <div className="mb-6 animate-fade-in">
      <Card className="max-w-[80%] bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
              {getIcon(phase)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900 dark:text-white">Frits</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">AI Consultant</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span>{getThinkingMessage(phase)}</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewTypingIndicator;