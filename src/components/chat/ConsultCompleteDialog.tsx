
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smile, Angry, AlertCircle, CircleDashed, Flame } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface ConsultCompleteDialogProps {
  open: boolean;
  onClose: () => void;
  onFinish: () => void;
}

type EmojiRating = "happy" | "angry" | "surprised" | "sleepy" | "fire" | null;

const ConsultCompleteDialog = ({ open, onClose, onFinish }: ConsultCompleteDialogProps) => {
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiRating>(null);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmojiSelect = (emoji: EmojiRating) => {
    setSelectedEmoji(emoji);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    
    try {
      // Here you would typically save the rating to your database
      // For now, we'll just log it to the console
      console.log("Rating submitted:", { emoji: selectedEmoji, review: reviewText });
      
      // After saving the rating, call the onFinish prop
      onFinish();
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Only trigger onClose when dialog is being closed, not when opened
      if (!isOpen) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Consult Session Complete</DialogTitle>
          <DialogDescription>
            This consult session is marked as complete in the database.
            How would you rate your experience?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-between items-center py-4">
          <button 
            onClick={() => handleEmojiSelect("happy")}
            className={`p-2 rounded-full ${selectedEmoji === "happy" ? "bg-green-100 ring-2 ring-green-500" : "hover:bg-gray-100"} transition-all`}
          >
            <Smile className={`h-8 w-8 ${selectedEmoji === "happy" ? "text-green-500" : "text-gray-500"}`} />
          </button>
          
          <button 
            onClick={() => handleEmojiSelect("angry")}
            className={`p-2 rounded-full ${selectedEmoji === "angry" ? "bg-red-100 ring-2 ring-red-500" : "hover:bg-gray-100"} transition-all`}
          >
            <Angry className={`h-8 w-8 ${selectedEmoji === "angry" ? "text-red-500" : "text-gray-500"}`} />
          </button>
          
          <button 
            onClick={() => handleEmojiSelect("surprised")}
            className={`p-2 rounded-full ${selectedEmoji === "surprised" ? "bg-blue-100 ring-2 ring-blue-500" : "hover:bg-gray-100"} transition-all`}
          >
            <AlertCircle className={`h-8 w-8 ${selectedEmoji === "surprised" ? "text-blue-500" : "text-gray-500"}`} />
          </button>
          
          <button 
            onClick={() => handleEmojiSelect("sleepy")}
            className={`p-2 rounded-full ${selectedEmoji === "sleepy" ? "bg-purple-100 ring-2 ring-purple-500" : "hover:bg-gray-100"} transition-all`}
          >
            <CircleDashed className={`h-8 w-8 ${selectedEmoji === "sleepy" ? "text-purple-500" : "text-gray-500"}`} />
          </button>
          
          <button 
            onClick={() => handleEmojiSelect("fire")}
            className={`p-2 rounded-full ${selectedEmoji === "fire" ? "bg-orange-100 ring-2 ring-orange-500" : "hover:bg-gray-100"} transition-all`}
          >
            <Flame className={`h-8 w-8 ${selectedEmoji === "fire" ? "text-orange-500" : "text-gray-500"}`} />
          </button>
        </div>
        
        {selectedEmoji && (
          <div className="mt-2 animate-in fade-in slide-in-from-top duration-300">
            <Textarea
              placeholder="Share your feedback about this consultation session..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full min-h-[100px]"
            />
          </div>
        )}

        <DialogFooter className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2">
          <Button onClick={onClose} variant="outline" disabled={isSubmitting}>
            Continue Chatting
          </Button>
          <Button 
            onClick={handleFinish} 
            className="bg-green-600 hover:bg-green-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "End Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConsultCompleteDialog;
