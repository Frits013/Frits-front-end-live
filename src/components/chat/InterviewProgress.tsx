import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, ArrowRight } from "lucide-react";

interface InterviewProgressProps {
  currentPhase: string;
  progress: number;
  totalQuestions: number;
  answeredQuestions: number;
  estimatedTimeLeft?: string;
}

const InterviewProgress = ({
  currentPhase,
  progress,
  totalQuestions,
  answeredQuestions,
  estimatedTimeLeft
}: InterviewProgressProps) => {
  const phases = [
    { name: 'Introduction', completed: progress >= 25 },
    { name: 'Core Questions', completed: progress >= 50 },
    { name: 'Summary', completed: progress >= 75 },
    { name: 'Conclusion', completed: progress >= 100 }
  ];

  const getPhaseColor = (phase: string, isActive: boolean, isCompleted: boolean) => {
    if (isCompleted) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (isActive) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
  };

  return (
    <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700">
      <CardContent className="p-4">
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

        {/* Progress bar */}
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span>{answeredQuestions} of {totalQuestions} questions</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Phase indicators */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {phases.map((phase, index) => (
            <div key={phase.name} className="flex items-center gap-2 min-w-0">
              <Badge 
                className={`text-xs transition-all duration-300 ${
                  getPhaseColor(phase.name, currentPhase === phase.name, phase.completed)
                }`}
              >
                <div className="flex items-center gap-1">
                  {phase.completed && <CheckCircle className="w-3 h-3" />}
                  <span className="truncate">{phase.name}</span>
                </div>
              </Badge>
              {index < phases.length - 1 && (
                <ArrowRight className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Current phase description */}
        <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Current Phase:</strong> {currentPhase}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InterviewProgress;