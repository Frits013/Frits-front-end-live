
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
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ChatHistoryDeleteDialogProps {
  chatId: string;
  chatTitle: string;
  isActive: boolean;
  onDelete: (id: string) => void;
}

const ChatHistoryDeleteDialog = ({
  chatId,
  chatTitle,
  isActive,
  onDelete
}: ChatHistoryDeleteDialogProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => e.stopPropagation()}
          className={`h-7 w-7 ${
            isActive 
              ? "hover:bg-red-500/20 text-white/80 hover:text-red-200" 
              : "hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
          }`}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-purple-200 dark:border-purple-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-900 dark:text-slate-100">
            Delete Consult History
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete "{chatTitle}"? This action cannot be undone and your consultation history will be permanently lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-slate-200 dark:border-slate-700">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onDelete(chatId)}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Delete Consult
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ChatHistoryDeleteDialog;
