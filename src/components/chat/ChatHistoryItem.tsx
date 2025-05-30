
import { useState } from "react";
import { Trash2, Edit2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ChatHistoryItemProps {
  id: string;
  title: string;
  isActive: boolean;
  isCompleted?: boolean;
  isFinishable?: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

const ChatHistoryItem = ({
  id,
  title,
  isActive,
  isCompleted = false,
  isFinishable = false,
  onSelect,
  onEdit,
  onDelete,
}: ChatHistoryItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusIcon = () => {
    if (isCompleted) {
      return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
    }
    if (isFinishable) {
      return <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
    }
    return <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />;
  };

  const getItemClasses = () => {
    if (isCompleted) {
      return "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700";
    }
    if (isFinishable) {
      return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50";
    }
    if (isActive) {
      return "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600";
    }
    return "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50";
  };

  return (
    <div
      className={cn(
        "group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer",
        getItemClasses()
      )}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3 min-w-0">
        {getStatusIcon()}
        
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "text-sm font-medium truncate",
            isCompleted ? "text-slate-600 dark:text-slate-400" : "text-gray-900 dark:text-gray-100"
          )}>
            {title}
          </h3>
        </div>

        {(isHovered || isActive) && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Chat Session</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistoryItem;
