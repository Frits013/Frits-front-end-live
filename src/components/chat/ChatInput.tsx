
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRef, useEffect, KeyboardEvent, useCallback } from "react";

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  isProcessing?: boolean;
}

const ChatInput = ({ inputMessage, setInputMessage, handleSendMessage, isProcessing = false }: ChatInputProps) => {
  const isMobile = useIsMobile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSubmitTime = useRef<number>(0);
  const isSubmittingRef = useRef<boolean>(false);
  
  // Auto-resize the textarea as content changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";
    // Set the height to match content (with a max-height applied via CSS)
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [inputMessage]);
  
  // Debounced submit handler to prevent rapid submissions
  const debouncedSubmit = useCallback((e: React.FormEvent) => {
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTime.current;
    
    // Prevent submissions within 500ms of each other
    if (timeSinceLastSubmit < 500 || isSubmittingRef.current) {
      e.preventDefault();
      return;
    }
    
    lastSubmitTime.current = now;
    isSubmittingRef.current = true;
    
    handleSendMessage(e);
    
    // Reset submission flag after a delay
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 1000);
  }, [handleSendMessage]);
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Shift+Enter to create a new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      
      // Only submit if we have content and not already processing
      if (inputMessage.trim() && !isProcessing && !isSubmittingRef.current) {
        debouncedSubmit(e);
      }
    }
    // For Shift+Enter, let the default behavior occur (inserting a newline)
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Preserve numbered lists when pressing Enter
    // Check if we're at the end of a line with a number followed by a period
    const lines = value.split('\n');
    const lastLine = lines[lines.length - 1];
    const numberedListRegex = /^(\d+)\.\s*$/;
    const match = lastLine.match(numberedListRegex);
    
    if (match) {
      // If user just pressed Enter after a numbered item, add the next number
      const nextNumber = parseInt(match[1]) + 1;
      setInputMessage(value.slice(0, -lastLine.length) + `${nextNumber}. `);
    } else {
      setInputMessage(value);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only submit if we have content and not already processing
    if (inputMessage.trim() && !isProcessing && !isSubmittingRef.current) {
      debouncedSubmit(e);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="relative">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex gap-3 items-center bg-white/10 dark:bg-gray-900/50 backdrop-blur-xl p-2 rounded-lg border border-purple-100/20 dark:border-purple-900/30">
          <Textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-purple-200 dark:border-purple-800 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all duration-300 min-h-[40px] max-h-[200px] resize-none py-2"
            disabled={isProcessing}
            rows={1}
          />
          <Button 
            type="submit" 
            className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-purple-500/50 transition-all duration-300 shrink-0 ${
              isMobile ? 'px-3' : ''
            }`}
            disabled={isProcessing || !inputMessage.trim()}
          >
            <Send className="w-4 h-4" />
            {!isMobile && <span className="ml-2">{isProcessing ? "Sending..." : "Send"}</span>}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
