import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Confetti from "@/components/ui/confetti";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import { useFeedbackSubmission } from "@/hooks/use-feedback-submission";

interface ConsultCompleteDialogProps {
  open: boolean;
  onClose: () => void;
  onFinish: () => void;
  sessionId?: string | null;
}

const ConsultCompleteDialog = ({ 
  open, 
  onClose, 
  onFinish, 
  sessionId 
}: ConsultCompleteDialogProps) => {
  const {
    selectedEmoji,
    reviewText,
    isSubmitting,
    handleEmojiSelect,
    handleReviewChange,
    handleSubmit
  } = useFeedbackSubmission({ 
    sessionId, 
    onFinish: () => {
      // This will be called after feedback is submitted successfully
      // But we want onFinish to be called from handleFinish to ensure proper flow
      console.log('Feedback submitted successfully');
    }
  });
  
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger confetti when dialog opens with a slight delay to ensure visibility
  useEffect(() => {
    if (open) {
      // Immediate confetti
      setShowConfetti(true);
      
      // Keep confetti for 6 seconds
      const confettiTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 6000);
      
      return () => {
        clearTimeout(confettiTimer);
        setShowConfetti(false);
      };
    } else {
      setShowConfetti(false);
    }
  }, [open]);

  const handleFinish = async () => {
    console.log('End Session button clicked - submitting feedback and ending session');
    // Submit feedback first
    const success = await handleSubmit();
    if (success) {
      // After successful feedback submission, end the session
      onFinish();
    }
  };

  return (
    <>
      <Confetti active={showConfetti} />
      <Dialog 
        open={open} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            // User closed dialog (X button or escape) - don't end session, just close
            console.log('Dialog closed without ending session');
            onClose();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] z-50">
          <DialogHeader>
            <DialogTitle>Consult Session Complete</DialogTitle>
            <DialogDescription>
              This consult session is marked as complete in the database.
              How would you rate your experience?
            </DialogDescription>
          </DialogHeader>
          
          <FeedbackForm
            selectedEmoji={selectedEmoji}
            reviewText={reviewText}
            onEmojiSelect={handleEmojiSelect}
            onReviewChange={handleReviewChange}
          />

          <DialogFooter className="mt-6">
            <Button 
              onClick={handleFinish} 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "End Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConsultCompleteDialog;
