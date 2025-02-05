import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ChatHeaderProps {
  onNewChat: () => void;
  onSignOut: () => void;
}

const ChatHeader = ({ onNewChat, onSignOut }: ChatHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <Button
        onClick={onNewChat}
        variant="default"
        className="flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        New Chat
      </Button>
      <Button onClick={onSignOut} variant="outline">
        Sign Out
      </Button>
    </div>
  );
};

export default ChatHeader;