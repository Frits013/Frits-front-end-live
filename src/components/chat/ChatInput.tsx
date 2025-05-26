
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
    <div className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50">
      <form onSubmit={handleFormSubmit} className="p-4">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="resize-none border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[64px] max-h-[200px] text-sm"
              disabled={isProcessing}
              rows={1}
            />
          </div>
          <Button 
            type="submit" 
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl px-6 py-3 shadow-lg hover:shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing || !inputMessage.trim()}
          >
            <Send className="w-5 h-5" />
            {!isMobile && <span className="ml-2">{isProcessing ? "Sending..." : "Send"}</span>}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
