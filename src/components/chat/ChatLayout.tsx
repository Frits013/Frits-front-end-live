
import { ReactNode } from "react";
import { SidebarProvider, Sidebar, SidebarTrigger } from "@/components/ui/sidebar";

interface ChatLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
}

const ChatLayout = ({ sidebar, content }: ChatLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-[100dvh] w-full bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 overflow-hidden">
        <Sidebar 
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50"
          collapsible="offcanvas"
        >
          {sidebar}
        </Sidebar>
        
        <div className="relative flex-1 flex overflow-hidden">
          <div className="absolute left-4 top-4 z-50">
            <SidebarTrigger className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200" />
          </div>
          {content}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ChatLayout;
