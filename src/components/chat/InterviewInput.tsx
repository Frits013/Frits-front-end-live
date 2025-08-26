import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Mic, Pause, Play } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRef, useEffect, KeyboardEvent, useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface InterviewInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  isProcessing?: boolean;
  currentPhase?: string;
  placeholder?: string;
}

const InterviewInput = ({ 
  inputMessage, 
  setInputMessage, 
  handleSendMessage, 
  isProcessing = false,
  currentPhase = "Core Questions",
  placeholder
}: InterviewInputProps) => {
  const isMobile = useIsMobile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSubmitTime = useRef<number>(0);
  const isSubmittingRef = useRef<boolean>(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Load draft from localStorage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('interview_input_draft');
    if (savedDraft && !inputMessage) {
      setInputMessage(savedDraft);
    }
  }, [setInputMessage, inputMessage]);
  
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
    
    // Clear draft from localStorage when message is sent
    localStorage.removeItem('interview_input_draft');
    
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
    
    // Save draft to localStorage
    if (value.trim()) {
      localStorage.setItem('interview_input_draft', value);
    } else {
      localStorage.removeItem('interview_input_draft');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only submit if we have content and not already processing
    if (inputMessage.trim() && !isProcessing && !isSubmittingRef.current) {
      debouncedSubmit(e);
    }
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    
    switch (currentPhase?.toLowerCase()) {
      case 'introduction':
        return "Tell Frits about yourself and what you'd like to discuss...";
      case 'core questions':
        return "Share your thoughts and experiences...";
      case 'summary':
        return "Any additional information you'd like to add...";
      case 'conclusion':
        return "Final thoughts or questions...";
      default:
        return "Type your response here...";
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // Voice recording functionality would be implemented here
  };

  return (
    <Card className="mx-4 mb-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-purple-200 dark:border-purple-700 shadow-lg">
      <CardContent className="p-4">
        <form onSubmit={handleFormSubmit}>
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                className="resize-none border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 rounded-xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[64px] max-h-[200px] text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
                disabled={isProcessing}
                rows={1}
              />
              
              {/* Character count for longer responses */}
              {inputMessage.length > 100 && (
                <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-500 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
                  {inputMessage.length}
                </div>
              )}
            </div>
            
            {/* Voice recording button */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleVoiceRecord}
              className="rounded-xl p-3 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              disabled={isProcessing}
            >
              {isRecording ? (
                <Pause className="w-5 h-5 text-red-500" />
              ) : (
                <Mic className="w-5 h-5 text-gray-500" />
              )}
            </Button>
            
            {/* Send button */}
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
        
        {/* Helper text */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {isProcessing && (
            <span className="text-purple-600 dark:text-purple-400">
              Frits is processing your response...
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InterviewInput;