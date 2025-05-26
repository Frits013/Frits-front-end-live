
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, MessageCircle } from "lucide-react";

interface ChatHistoryEditItemProps {
  editingTitle: string;
  onTitleChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const ChatHistoryEditItem = ({
  editingTitle,
  onTitleChange,
  onSave,
  onCancel,
}: ChatHistoryEditItemProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="group relative rounded-xl border border-purple-300 dark:border-purple-600 bg-white dark:bg-slate-800 shadow-lg shadow-purple-500/10">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <Input
              value={editingTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-sm font-medium border-purple-200 dark:border-purple-700 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-purple-500/20"
              placeholder="Enter consult title..."
              autoFocus
            />
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Press Enter to save, Escape to cancel
            </p>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSave}
          className="h-7 w-7 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
        >
          <Check className="h-3 w-3" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-7 w-7 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHistoryEditItem;
