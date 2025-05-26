
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
      console.log('Feedback submitted successfully');
    }
  });
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Trigger confetti when dialog opens with a slight delay to ensure visibility
  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      
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

  const handleSubmitFeedback = async () => {
    console.log('Submit feedback button clicked');
    const success = await handleSubmit();
    if (success) {
      // After successful feedback submission, end the session
      onFinish();
    }
  };

  const handleCloseAttempt = () => {
    console.log('Close button clicked - showing confirmation dialog');
    setShowExitConfirm(true);
  };

  const handleConfirmExit = () => {
    console.log('User confirmed exit without feedback');
    setShowExitConfirm(false);
    onFinish(); // End the session without feedback
  };

  const handleCancelExit = () => {
    console.log('User cancelled exit - staying in dialog');
    setShowExitConfirm(false);
  };

  return (
    <>
      <Confetti active={showConfetti} />
      <Dialog 
        open={open} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleCloseAttempt();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] z-50" hideCloseButton={true}>
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

          <DialogFooter className="mt-6 gap-2">
            <Button 
              variant="outline"
              onClick={handleCloseAttempt}
              disabled={isSubmitting}
            >
              Close
            </Button>
            <Button 
              onClick={handleSubmitFeedback} 
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Consult Without Feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to end the consult without submitting feedback?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelExit}>
              No, Go Back
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit}>
              Yes, End Consult
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ConsultCompleteDialog;
