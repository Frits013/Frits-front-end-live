
import { ReactNode, useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
}

const ChatLayout = ({ sidebar, content }: ChatLayoutProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // Enhanced mobile pull-to-refresh prevention
  useEffect(() => {
    if (isMobile) {
      // Prevent pull-to-refresh on the entire document
      const preventPullToRefresh = (e: TouchEvent) => {
        // Get the element being touched
        const target = e.target as HTMLElement;
        
        // Check if we're touching a scrollable area
        const scrollableParent = target.closest('[data-radix-scroll-area-viewport]');
        
        if (scrollableParent) {
          // If we're at the top of a scrollable area and trying to scroll up
          if (scrollableParent.scrollTop === 0) {
            const touch = e.touches[0];
            const startY = touch.clientY;
            
            // Store the start position
            (e.target as any).__startY = startY;
          }
        } else {
          // If we're not in a scrollable area, prevent pull-to-refresh entirely
          if (e.touches.length === 1 && window.scrollY === 0) {
            e.preventDefault();
          }
        }
      };

      const preventPullToRefreshMove = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        const scrollableParent = target.closest('[data-radix-scroll-area-viewport]');
        
        if (!scrollableParent && window.scrollY === 0) {
          const touch = e.touches[0];
          const startY = (e.target as any).__startY || 0;
          const deltaY = touch.clientY - startY;
          
          // Prevent downward swipe at the top of the page
          if (deltaY > 0) {
            e.preventDefault();
          }
        }
      };

      // Add event listeners with passive: false to allow preventDefault
      document.addEventListener('touchstart', preventPullToRefresh, { passive: false });
      document.addEventListener('touchmove', preventPullToRefreshMove, { passive: false });

      // Set CSS properties to prevent overscroll
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overscrollBehavior = 'none';

      return () => {
        document.removeEventListener('touchstart', preventPullToRefresh);
        document.removeEventListener('touchmove', preventPullToRefreshMove);
        document.body.style.overscrollBehavior = '';
        document.documentElement.style.overscrollBehavior = '';
      };
    }
  }, [isMobile]);

  return (
    <div 
      className="flex min-h-[100dvh] w-full bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 overflow-hidden"
      style={isMobile ? {
        overscrollBehavior: 'none',
        touchAction: 'pan-x pan-y',
        WebkitOverflowScrolling: 'touch'
      } : undefined}
    >
      {isMobile ? (
        <>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="fixed left-4 top-4 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="w-[300px] p-0 overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50"
              style={{
                overscrollBehavior: 'none',
                touchAction: 'pan-y'
              }}
            >
              <div className="h-full flex flex-col">
                {sidebar}
              </div>
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <div className="block bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50">
          {sidebar}
        </div>
      )}
      <div className="relative flex-1 flex overflow-hidden">
        {content}
      </div>
    </div>
  );
};

export default ChatLayout;
