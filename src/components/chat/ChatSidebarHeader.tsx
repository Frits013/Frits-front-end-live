
import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarHeader } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

interface ChatSidebarHeaderProps {
  onNewChat: () => void;
}

const ChatSidebarHeader = ({ onNewChat }: ChatSidebarHeaderProps) => {
  const navigate = useNavigate();

  return (
    <SidebarHeader className="border-b border-purple-200/50 dark:border-purple-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="flex flex-col gap-3 p-4">
        <Button
          onClick={onNewChat}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
          size="lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Consult
        </Button>
        
        <Button
          onClick={() => navigate('/company-export')}
          variant="outline"
          className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950/50"
          size="sm"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>
    </SidebarHeader>
  );
};

export default ChatSidebarHeader;
