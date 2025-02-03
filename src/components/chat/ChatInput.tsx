import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
}

const ChatInput = ({ inputMessage, setInputMessage, handleSendMessage }: ChatInputProps) => {
  const isMobile = useIsMobile();

  return (
    <form onSubmit={handleSendMessage} className="relative">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex gap-3 items-center bg-white/10 dark:bg-gray-900/50 backdrop-blur-xl p-2 rounded-lg border border-purple-100/20 dark:border-purple-900/30">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-purple-200 dark:border-purple-800 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all duration-300"
          />
          <Button 
            type="submit" 
            className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-purple-500/50 transition-all duration-300 ${
              isMobile ? 'px-3' : ''
            }`}
          >
            <Send className="w-4 h-4" />
            {!isMobile && <span className="ml-2">Send</span>}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;