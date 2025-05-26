
import { SidebarContent } from "@/components/ui/sidebar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ChatSidebarHeader from "./ChatSidebarHeader";

interface ChatSidebarLoaderProps {
  onNewChat: () => void;
}

const ChatSidebarLoader = ({ onNewChat }: ChatSidebarLoaderProps) => {
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-purple-50/30 dark:from-slate-900 dark:to-purple-950/30">
      <ChatSidebarHeader onNewChat={onNewChat} />
      
      <SidebarContent className="flex-1 overflow-auto px-3 py-4">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="sm" text="Loading sessions..." />
        </div>
      </SidebarContent>
    </div>
  );
};

export default ChatSidebarLoader;
