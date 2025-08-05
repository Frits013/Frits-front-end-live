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
    questionCount: number;
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
  // Define the correct phases with proper names and order
  const phaseDefinitions = [
    { id: 'introduction', name: 'Introduction', maxQuestions: 3 },
    { id: 'theme_selection', name: 'Theme Selection', maxQuestions: 5 },
    { id: 'deep_dive', name: 'Deep Dive', maxQuestions: 8 },
    { id: 'summary', name: 'Summary', maxQuestions: 3 },
    { id: 'recommendations', name: 'Recommendations', maxQuestions: 2 }
  ];

  // Calculate total progress across all phases
  const totalMaxQuestions = phaseDefinitions.reduce((sum, phase) => sum + phase.maxQuestions, 0);
  const totalProgress = Math.min((answeredQuestions / totalMaxQuestions) * 100, 100);

  // Calculate current phase progress - use demo data for accurate tracking
  const currentPhaseQuestions = demoPhaseData?.questionCount || phaseInfo?.questions_in_phase || 0;
  const currentPhaseMaxQuestions = demoPhaseData?.maxQuestions || phaseInfo?.max_questions_in_phase || 5;
  const currentPhaseProgress = currentPhaseMaxQuestions > 0 ? 
    Math.min((currentPhaseQuestions / currentPhaseMaxQuestions) * 100, 100) : 0;

  const getPhaseStatus = (phaseId: string) => {
    if (!currentPhase) return { isActive: false, isCompleted: false, progress: 0 };
    
    const currentIndex = phaseDefinitions.findIndex(p => p.id === currentPhase);
    const phaseIndex = phaseDefinitions.findIndex(p => p.id === phaseId);
    
    const isActive = phaseId === currentPhase;
    const isCompleted = phaseIndex < currentIndex || (isActive && phaseInfo?.should_transition);
    
    // If completed or should transition, show 100%, otherwise show actual progress for current phase
    const progress = isCompleted ? 100 : (isActive ? currentPhaseProgress : 0);
    
    return { isActive, isCompleted, progress };
  };

  const getPhaseColor = (isActive: boolean, isCompleted: boolean) => {
    if (isCompleted) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (isActive) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
  };

  return (
    <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Interview Progress
          </h3>
          {estimatedTimeLeft && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{estimatedTimeLeft} remaining</span>
            </div>
          )}
        </div>

        {/* Total Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
            <span>Total Interview Progress</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <Progress value={totalProgress} className="h-2 mb-2" />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{answeredQuestions} of {totalMaxQuestions} total questions</span>
          </div>
        </div>

        {/* Current Phase Progress */}
        {currentPhase && (currentPhaseQuestions > 0 || currentPhaseMaxQuestions > 0) && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
              <span>Current Phase: {phaseDefinitions.find(p => p.id === currentPhase)?.name}</span>
              <span>{Math.round(currentPhaseProgress)}%</span>
            </div>
            <Progress value={currentPhaseProgress} className="h-2 mb-2" />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{currentPhaseQuestions} of {currentPhaseMaxQuestions} answers</span>
            </div>
          </div>
        )}

        {/* Phase indicators */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {phaseDefinitions.map((phase, index) => {
            const status = getPhaseStatus(phase.id);
            return (
              <div key={phase.id} className="flex items-center gap-2 min-w-0">
                <div className="flex flex-col items-center gap-1">
                  <Badge 
                    className={`text-xs transition-all duration-300 ${
                      getPhaseColor(status.isActive, status.isCompleted)
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {status.isCompleted && <CheckCircle className="w-3 h-3" />}
                      <span className="truncate">{phase.name}</span>
                    </div>
                  </Badge>
                  <Progress value={status.progress} className="h-1 w-16" />
                </div>
                {index < phaseDefinitions.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default InterviewProgress;