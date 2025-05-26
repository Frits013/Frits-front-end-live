
import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & { onScroll?: React.UIEventHandler<HTMLDivElement> }
>(({ className, children, onScroll, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
      // Use "scroll" type on mobile for native scrolling, "hover" on desktop
      type={isMobile ? "scroll" : "hover"}
    >
      <ScrollAreaPrimitive.Viewport 
        className={cn(
          "h-full w-full rounded-[inherit] overflow-y-auto",
          // Enhanced mobile scroll handling
          isMobile && "overscroll-none touch-pan-y"
        )}
        style={isMobile ? {
          overscrollBehavior: 'none',
          WebkitOverflowScrolling: 'touch',
          // Additional properties to prevent pull-to-refresh
          touchAction: 'pan-y',
          overscrollBehaviorY: 'none'
        } : undefined}
        onScroll={onScroll}
        onTouchStart={isMobile ? (e) => {
          // Prevent pull-to-refresh if we're at the top and trying to scroll up
          const element = e.currentTarget;
          if (element.scrollTop === 0) {
            const touch = e.touches[0];
            const startY = touch.clientY;
            
            const handleTouchMove = (moveEvent: TouchEvent) => {
              const moveTouch = moveEvent.touches[0];
              const deltaY = moveTouch.clientY - startY;
              
              // If scrolling down from the top, prevent the default behavior
              if (deltaY > 0 && element.scrollTop === 0) {
                moveEvent.preventDefault();
              }
            };
            
            const handleTouchEnd = () => {
              document.removeEventListener('touchmove', handleTouchMove, { passive: false } as any);
              document.removeEventListener('touchend', handleTouchEnd);
            };
            
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
          }
        } : undefined}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {/* Only show scrollbar on desktop */}
      {!isMobile && <ScrollBar />}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
})
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
