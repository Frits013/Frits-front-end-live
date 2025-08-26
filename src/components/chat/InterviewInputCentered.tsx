import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, MicOff } from "lucide-react";

interface InterviewInputCenteredProps {
  onSubmit: (message: string) => void;
  isProcessing: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const InterviewInputCentered = ({
  onSubmit,
  isProcessing,
  disabled = false,
  placeholder = "Type your answer here..."
}: InterviewInputCenteredProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load draft from localStorage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("interview_centered_input_draft");
    if (savedDraft && !inputValue) {
      setInputValue(savedDraft);
    }
  }, [inputValue]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isProcessing && !disabled) {
      onSubmit(inputValue.trim());
      setInputValue("");
      // Clear draft from localStorage when message is sent
      localStorage.removeItem("interview_centered_input_draft");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual voice recording
  };

  const isSubmitDisabled = !inputValue.trim() || isProcessing || disabled;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 via-background/90 to-transparent backdrop-blur-xl border-t border-border/50 z-40"
    >
      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative bg-background/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 focus-within:border-primary/50 focus-within:shadow-primary/10">
            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => {
                const value = e.target.value;
                setInputValue(value);
                // Save draft to localStorage
                if (value.trim()) {
                  localStorage.setItem("interview_centered_input_draft", value);
                } else {
                  localStorage.removeItem("interview_centered_input_draft");
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isProcessing}
              className="border-0 bg-transparent resize-none min-h-[60px] max-h-[200px] text-lg leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 pr-28 py-5 px-6"
              rows={1}
            />

            {/* Action Buttons */}
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              {/* Voice Recording Button */}
              <Button
                type="button"
                onClick={toggleRecording}
                variant="ghost"
                size="sm"
                className={`rounded-full w-10 h-10 p-0 ${
                  isRecording ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : ''
                }`}
                disabled={disabled || isProcessing}
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="rounded-full w-10 h-10 p-0 hover:scale-105 transition-transform"
              >
                {isProcessing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-background border-t-transparent rounded-full"
                  />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Character Counter */}
          {inputValue.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground mt-2 text-right"
            >
              {inputValue.length} characters
            </motion.div>
          )}
        </form>

        {/* Processing Indicator */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-4"
          >
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      delay: i * 0.2 
                    }}
                    className="w-2 h-2 bg-primary/60 rounded-full"
                  />
                ))}
              </div>
              Processing your answer...
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default InterviewInputCentered;