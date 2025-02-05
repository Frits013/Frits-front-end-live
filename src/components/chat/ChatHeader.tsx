import { Button } from "@/components/ui/button";
import { Plus, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ProfileDialog from "./ProfileDialog";
import { useState } from "react";

interface ChatHeaderProps {
  onNewChat: () => void;
  onSignOut: () => void;
}

const ChatHeader = ({ onNewChat, onSignOut }: ChatHeaderProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar>
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSignOut}>
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ProfileDialog 
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
    </div>
  );
};

export default ChatHeader;