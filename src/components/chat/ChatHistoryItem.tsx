import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
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
import { SidebarMenuButton } from "@/components/ui/sidebar";

interface ChatHistoryItemProps {
  id: string;
  title: string;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

const ChatHistoryItem = ({
  id,
  title,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: ChatHistoryItemProps) => {
  return (
    <div className="flex items-center w-full gap-2">
      <SidebarMenuButton
        onClick={onSelect}
        isActive={isActive}
        className="flex-1"
      >
        {title}
      </SidebarMenuButton>
      <Button
        variant="ghost"
        size="icon"
        onClick={onEdit}
        className="h-8 w-8"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the chat history? Your conversation will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatHistoryItem;