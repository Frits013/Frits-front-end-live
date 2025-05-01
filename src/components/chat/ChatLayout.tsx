
import { ReactNode, useState } from "react";
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

  return (
    <div className="flex min-h-[100dvh] w-full bg-gradient-to-br from-purple-50/30 via-blue-50/30 to-purple-50/30">
      {isMobile ? (
        <>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="fixed left-4 top-4 z-50"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="w-[280px] p-0"
            >
              {sidebar}
            </SheetContent>
          </Sheet>
          <div className="flex-1">
            {content}
          </div>
        </>
      ) : (
        <>
          <div className="w-[280px] min-h-[100dvh] border-r border-gray-200">
            {sidebar}
          </div>
          <div className="flex-1">
            {content}
          </div>
        </>
      )}
    </div>
  );
};

export default ChatLayout;
