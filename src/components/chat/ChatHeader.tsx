import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";

interface ChatHeaderProps {
  onNewChat: () => void;
  onSignOut: () => void;
}

const ChatHeader = ({ onNewChat, onSignOut }: ChatHeaderProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b p-4 flex justify-between items-center">
      <Button
        onClick={onNewChat}
        variant="ghost"
        size="icon"
        className="w-8 h-8"
      >
        <Plus className="w-4 h-4" />
      </Button>
      <Button
        onClick={onSignOut}
        variant="ghost"
        size="icon"
        className="w-8 h-8"
      >
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ChatHeader;