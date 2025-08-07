
import { Button } from "@/components/ui/button";
import { User, Plus } from "lucide-react";
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
  onSignOut: () => void;
  isInCanvas?: boolean;
  createNewChat: () => Promise<void>;
}

const ChatHeader = ({ onSignOut, isInCanvas = false, createNewChat }: ChatHeaderProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className={isInCanvas ? "" : "absolute top-4 right-4 z-50"}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size={isInCanvas ? "lg" : "icon"} 
            className={`rounded-full ${
              isInCanvas 
                ? "bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg backdrop-blur-sm border border-purple-400/30 w-12 h-12" 
                : ""
            }`}
          >
            <Avatar className={isInCanvas ? "w-8 h-8" : ""}>
              <AvatarFallback className={isInCanvas ? "bg-transparent text-white" : ""}>
                <User className={isInCanvas ? "h-6 w-6" : "h-5 w-5"} />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={createNewChat}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white hover:text-white focus:bg-gradient-to-r focus:from-purple-700 focus:to-indigo-700 focus:text-white mb-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start New Consult
          </DropdownMenuItem>
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
