import { ChatMessage, InterviewPhase } from "@/types/chat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

interface SummaryRecommendationsDisplayProps {
  messages: ChatMessage[];
  currentPhase: InterviewPhase;
  onGetRecommendations: () => void;
  canTriggerRecommendations: boolean;
}

const SummaryRecommendationsDisplay = ({
  messages,
  currentPhase,
  onGetRecommendations,
  canTriggerRecommendations
}: SummaryRecommendationsDisplayProps) => {
  // Get the latest assistant message for display
  const latestAssistantMessage = messages
    .filter(msg => msg.role === 'assistant')
    .slice(-1)[0];

  if (!latestAssistantMessage || (currentPhase !== 'summary' && currentPhase !== 'recommendations')) {
    return null;
  }

  const isSummaryPhase = currentPhase === 'summary';
  const isRecommendationsPhase = currentPhase === 'recommendations';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto p-6"
    >
      <Card className="bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3 mb-2">
            {isSummaryPhase ? (
              <FileText className="w-6 h-6 text-primary" />
            ) : (
              <Lightbulb className="w-6 h-6 text-secondary" />
            )}
            <h2 className="text-2xl font-bold text-foreground">
              {isSummaryPhase ? 'Your AI Readiness Summary' : 'Personalized Recommendations'}
            </h2>
          </div>
          <p className="text-muted-foreground">
            {isSummaryPhase 
              ? 'Here\'s a comprehensive summary of your AI readiness interview' 
              : 'Based on our conversation, here are actionable recommendations for you'
            }
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="prose prose-lg max-w-none text-foreground">
            <div className="whitespace-pre-wrap leading-relaxed">
              {latestAssistantMessage.content}
            </div>
          </div>
        </div>

        {/* Action Button for Summary Phase */}
        {isSummaryPhase && canTriggerRecommendations && (
          <div className="p-6 border-t border-border/50">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <Button
                onClick={onGetRecommendations}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-primary/30 transition-all duration-300 transform hover:scale-[1.02]"
              >
                <span>Get My Recommendations!</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        )}

        {/* Completion indicator for Recommendations Phase */}
        {isRecommendationsPhase && (
          <div className="p-6 border-t border-border/50">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-full border border-green-500/20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Interview Complete</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default SummaryRecommendationsDisplay;