
import { ReactNode } from "react";
import { ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";

interface ChatPanelLayoutProps {
  children: ReactNode;
}

const ChatPanelLayout = ({ children }: ChatPanelLayoutProps) => {
  return (
    <div className="flex-1 flex flex-col h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="flex-1 overflow-hidden p-3 sm:p-8 flex flex-col">
        <div className="relative">
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-white/30 to-indigo-100/20 dark:from-purple-900/10 dark:via-gray-900/20 dark:to-indigo-900/10 rounded-3xl transform rotate-1 scale-[1.02] blur-sm"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100/20 via-white/30 to-purple-100/20 dark:from-indigo-900/10 dark:via-gray-900/20 dark:to-purple-900/10 rounded-3xl transform -rotate-1 scale-[1.01] blur-sm"></div>
          
          <ResizablePanelGroup 
            direction="vertical" 
            className="relative min-h-[calc(100dvh-4rem)] bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/30 overflow-hidden transform transition-all duration-300 hover:shadow-purple-500/10 hover:scale-[1.002]"
          >
            {children}
            
            {/* Enhanced Resizable Handle with Prominent Drag Indicator */}
            <ResizableHandle 
              withHandle={true}
              className="relative group h-4 cursor-row-resize bg-gradient-to-r from-purple-200/80 via-indigo-200/80 to-purple-200/80 dark:from-purple-700/60 dark:via-indigo-700/60 dark:to-purple-700/60 hover:from-purple-300/90 hover:via-indigo-300/90 hover:to-purple-300/90 dark:hover:from-purple-600/70 dark:hover:via-indigo-600/70 dark:hover:to-purple-600/70 transition-all duration-300"
            />
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
};

export default ChatPanelLayout;
