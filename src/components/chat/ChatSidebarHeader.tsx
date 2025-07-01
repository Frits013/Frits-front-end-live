
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SidebarHeader } from "@/components/ui/sidebar";

interface ChatSidebarHeaderProps {
  onNewChat: () => void;
}

const ChatSidebarHeader = ({ onNewChat }: ChatSidebarHeaderProps) => {
  return (
    <SidebarHeader className="p-6 border-b border-purple-100/50 dark:border-purple-800/30">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-md">
          <img 
            src="/lovable-uploads/ce7d4647-07c6-43a0-8521-b08cda6a3711.png" 
            alt="FIDDS Logo" 
            className="w-10 h-10 object-contain"
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Frits AI</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your AI Consultant</p>
        </div>
      </div>
      <Button
        onClick={onNewChat}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 border-0"
        size="lg"
      >
        <Plus className="w-4 h-4 mr-2" />
        Start New Consult
      </Button>
    </SidebarHeader>
  );
};

export default ChatSidebarHeader;
