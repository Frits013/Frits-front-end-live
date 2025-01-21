import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";

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
  return (
    <div className="flex items-center w-full gap-2">
      <Input
        value={editingTitle}
        onChange={(e) => onTitleChange(e.target.value)}
        className="h-8 flex-1"
        autoFocus
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={onSave}
        className="h-8 w-8"
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onCancel}
        className="h-8 w-8"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ChatHistoryEditItem;