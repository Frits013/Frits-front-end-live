import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, ArrowRight } from "lucide-react";
import { InterviewPhase, PhaseInfo } from "@/types/chat";
interface InterviewProgressProps {
  currentPhase?: InterviewPhase;
  phaseInfo?: PhaseInfo;
  totalQuestions: number;
  answeredQuestions: number;
  estimatedTimeLeft?: string;
  demoPhaseData?: {
    currentPhase: InterviewPhase;
    answerCount: number;
    maxQuestions: number;
  };
}
const InterviewProgress = ({
  currentPhase,
  phaseInfo,
  totalQuestions,
  answeredQuestions,
  estimatedTimeLeft,
  demoPhaseData
}: InterviewProgressProps) => {
  // Define the correct phases with proper names and order - aligned with use-demo-phase-management
  const phaseDefinitions = [{
    id: 'introduction',
    name: 'Introduction',
    maxQuestions: 3
  }, {
    id: 'theme_selection',
    name: 'Theme Selection',
    maxQuestions: 4
  }, {
    id: 'deep_dive',
    name: 'Deep Dive',
    maxQuestions: 10
  }, {
    id: 'summary',
    name: 'Summary',
    maxQuestions: 1
  }, {
    id: 'recommendations',
    name: 'Recommendations',
    maxQuestions: 1
  }];

  // Calculate total progress only for interview phases (exclude summary and recommendations)
  const interviewPhases = phaseDefinitions.slice(0, 3); // Only introduction, theme_selection, deep_dive
  const totalMaxQuestions = interviewPhases.reduce((sum, phase) => sum + phase.maxQuestions, 0); // = 17
  const totalProgress = Math.min(answeredQuestions / totalMaxQuestions * 100, 100);

  // Calculate current phase progress - use demo data for accurate tracking
  const currentPhaseDefinition = phaseDefinitions.find(p => p.id === currentPhase);
  const currentPhaseMaxQuestions = currentPhaseDefinition?.maxQuestions || 5;

  // Use demo phase data if available for accurate current phase tracking
  const currentPhaseQuestions = demoPhaseData?.answerCount ?? 0;
  const currentPhaseProgress = currentPhaseMaxQuestions > 0 ? Math.min(currentPhaseQuestions / currentPhaseMaxQuestions * 100, 100) : 0;
  const getPhaseStatus = (phaseId: string) => {
    if (!currentPhase) return {
      isActive: false,
      isCompleted: false,
      progress: 0
    };
    const currentIndex = phaseDefinitions.findIndex(p => p.id === currentPhase);
    const phaseIndex = phaseDefinitions.findIndex(p => p.id === phaseId);
    const isActive = phaseId === currentPhase;
    const isCompleted = phaseIndex < currentIndex || isActive && phaseInfo?.should_transition;

    // If completed or should transition, show 100%, otherwise show actual progress for current phase
    const progress = isCompleted ? 100 : isActive ? currentPhaseProgress : 0;
    return {
      isActive,
      isCompleted,
      progress
    };
  };
  const getPhaseColor = (isActive: boolean, isCompleted: boolean) => {
    if (isCompleted) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (isActive) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
  };
  return <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Interview Progress
          </h3>
        </div>

        {/* Total Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
            <span>Total Interview Progress</span>
          </div>
          <Progress value={totalProgress} className="h-2 mb-2" />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{answeredQuestions} of {totalMaxQuestions} total questions - {Math.round(totalProgress)}%</span>
          </div>
        </div>

        {/* Phase indicators */}
        <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2">
          {phaseDefinitions.map((phase, index) => {
          const status = getPhaseStatus(phase.id);
          return <div key={phase.id} className="flex items-center gap-3 min-w-0">
                <div className="flex flex-col items-center gap-2">
                  <Badge className={`text-sm px-3 py-1 transition-all duration-300 ${getPhaseColor(status.isActive, status.isCompleted)}`}>
                    <div className="flex items-center gap-2">
                      {status.isCompleted && <CheckCircle className="w-4 h-4" />}
                      <span className="truncate">{phase.name}</span>
                    </div>
                  </Badge>
                  <Progress value={status.progress} className="h-2 w-24" />
                </div>
                {index < phaseDefinitions.length - 1 && <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />}
              </div>;
        })}
        </div>
      </CardContent>
    </Card>;
};
export default InterviewProgress;