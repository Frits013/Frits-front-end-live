import { ChatMessage, InterviewPhase } from "@/types/chat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight, Lightbulb, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface SummaryRecommendationsDisplayProps {
  messages: ChatMessage[];
  currentPhase: InterviewPhase;
  onGetRecommendations: () => void;
  canTriggerRecommendations: boolean;
  isLoading?: boolean;
  isProcessing?: boolean;
  onEndInterview?: () => void;
}

const SummaryRecommendationsDisplay = ({
  messages,
  currentPhase,
  onGetRecommendations,
  canTriggerRecommendations,
  isLoading = false,
  isProcessing = false,
  onEndInterview
}: SummaryRecommendationsDisplayProps) => {
  // Get the latest assistant message for display
  const latestAssistantMessage = messages
    .filter(msg => msg.role === 'assistant')
    .slice(-1)[0];

  if (currentPhase !== 'summary' && currentPhase !== 'recommendations') {
    return null;
  }

  const isSummaryPhase = currentPhase === 'summary';
  const isRecommendationsPhase = currentPhase === 'recommendations';
  
  // Show loading state if we're processing (waiting for next writer message)
  const shouldShowLoading = isProcessing;

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
              {isSummaryPhase ? 'Your interview Summary' : 'Personalized Recommendations'}
            </h2>
          </div>
          <p className="text-muted-foreground">
            {isSummaryPhase 
              ? 'Here\'s a comprehensive summary of your interview' 
              : 'Based on our conversation, here are actionable recommendations for you'
            }
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {shouldShowLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground text-center">
                {isSummaryPhase 
                  ? "Generating your interview summary..." 
                  : "We hope you liked this new interview style :)..."
                }
              </p>
            </div>
          ) : latestAssistantMessage ? (
            <div className="prose prose-lg max-w-none text-foreground">
              <div className="whitespace-pre-wrap leading-relaxed">
                {latestAssistantMessage.content}
              </div>
            </div>
          ) : null}
        </div>

        {/* Action Button for Summary Phase */}
        {isSummaryPhase && canTriggerRecommendations && !shouldShowLoading && latestAssistantMessage && (
          <div className="p-6 border-t border-border/50">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <Button
                onClick={onGetRecommendations}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:from-primary/50 disabled:to-primary/40 text-primary-foreground py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-primary/30 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? 'Generating Recommendations...' : 'Get My Recommendations!'}</span>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5 ml-2" />
                )}
              </Button>
            </motion.div>
          </div>
        )}

        {/* End Interview Button for Recommendations Phase */}
        {currentPhase === 'recommendations' && onEndInterview && !shouldShowLoading && latestAssistantMessage && (
          <div className="mt-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button
                onClick={onEndInterview}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-8 text-lg font-semibold rounded-xl shadow-lg hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-[1.02]"
              >
                <Lightbulb className="w-5 h-5 mr-2" />
                <span>End Interview</span>
              </Button>
            </motion.div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default SummaryRecommendationsDisplay;