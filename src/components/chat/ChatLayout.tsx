import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
}

const ChatLayout = ({ sidebar, content }: ChatLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-[100dvh] w-full bg-gradient-to-br from-purple-50/30 via-blue-50/30 to-purple-50/30">
      <div className={`${isMobile ? 'hidden' : 'block'}`}>
        {sidebar}
      </div>
      {content}
    </div>
  );
};

export default ChatLayout;