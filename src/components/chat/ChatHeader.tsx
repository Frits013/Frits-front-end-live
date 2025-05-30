
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ProfileDialog from "./ProfileDialog";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatHeaderProps {
  onSignOut: () => void;
  isInCanvas?: boolean;
}

const ChatHeader = ({ onSignOut, isInCanvas = false }: ChatHeaderProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className={isInCanvas ? "" : isMobile ? "fixed top-4 right-4 z-50" : "absolute top-4 right-4 z-50"}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size={isInCanvas ? "lg" : "icon"} 
            className={`rounded-full ${
              isInCanvas 
                ? "bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg backdrop-blur-sm border border-purple-400/30 w-12 h-12" 
                : isMobile 
                ? "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800"
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
