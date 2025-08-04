
import { Button } from "@/components/ui/button";
import { Pencil, Check, MessageCircle, Clock, Flag } from "lucide-react";
import ChatHistoryDeleteDialog from "./ChatHistoryDeleteDialog";

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
  // Determine the display state priority: completed > finishable > active/ongoing
  const displayState = isCompleted ? 'completed' : isFinishable ? 'finishable' : 'ongoing';
  
  return (
    <div className={`group relative rounded-xl border transition-all duration-200 ${
      isActive 
        ? "bg-gradient-to-r from-purple-500 to-indigo-600 border-purple-400 shadow-lg shadow-purple-500/25" 
        : displayState === 'completed'
        ? "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
        : displayState === 'finishable'
        ? "bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 border-amber-200 dark:border-amber-800/40 hover:border-amber-300 dark:hover:border-amber-700/60 hover:shadow-md"
        : "bg-white hover:bg-purple-50 dark:bg-slate-800/30 dark:hover:bg-purple-900/20 border-purple-100 dark:border-purple-800/30 hover:border-purple-200 dark:hover:border-purple-700/50 hover:shadow-md"
    }`}>
      <button
        onClick={onSelect}
        className="w-full p-5 pb-12 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-xl"
      >
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
            isActive 
              ? "bg-white/20 text-white" 
              : displayState === 'completed'
              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              : displayState === 'finishable'
              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
              : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          }`}>
            {displayState === 'completed' ? (
              <Check className="w-4 h-4" />
            ) : displayState === 'finishable' ? (
              <Flag className="w-4 h-4" />
            ) : isActive ? (
              <MessageCircle className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-sm truncate ${
              isActive 
                ? "text-white" 
                : "text-slate-900 dark:text-slate-100"
            }`}>
              {title}
            </h3>
            <p className={`text-xs mt-1 ${
              isActive 
                ? "text-purple-100" 
                : displayState === 'completed'
                ? "text-slate-500 dark:text-slate-400"
                : displayState === 'finishable'
                ? "text-amber-600 dark:text-amber-400"
                : "text-purple-600 dark:text-purple-400"
            }`}>
              {displayState === 'completed' ? "Completed" : displayState === 'finishable' ? "Ready to Finish" : isActive ? "Active" : "Ongoing"}
            </p>
          </div>
        </div>
      </button>
      
      {/* Action buttons */}
      <div className={`absolute bottom-2 right-2 flex gap-1 transition-opacity duration-200 ${
        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      }`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className={`h-7 w-7 ${
            isActive 
              ? "hover:bg-white/20 text-white/80 hover:text-white" 
              : "hover:bg-purple-100 dark:hover:bg-purple-900/50 text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400"
          }`}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        
        <ChatHistoryDeleteDialog
          chatId={id}
          chatTitle={title}
          isActive={isActive}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};

export default ChatHistoryItem;
