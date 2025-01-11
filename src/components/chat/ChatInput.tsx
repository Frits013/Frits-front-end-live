import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
}

const ChatInput = ({ inputMessage, setInputMessage, handleSendMessage }: ChatInputProps) => {
  return (
    <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
      <Input
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-purple-100 dark:border-purple-900 focus:ring-purple-500 dark:focus:ring-purple-400"
      />
      <Button 
        type="submit" 
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transition-all duration-300"
      >
        <Send className="w-4 h-4 mr-2" />
        Send
      </Button>
    </form>
  );
};

export default ChatInput;