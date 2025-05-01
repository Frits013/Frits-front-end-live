
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { EmojiRating } from "@/components/feedback/EmojiRatingSelector";

interface UseFeedbackSubmissionProps {
  sessionId?: string | null;
  onFinish: () => void;
}

export const useFeedbackSubmission = ({ sessionId, onFinish }: UseFeedbackSubmissionProps) => {
  const { toast } = useToast();
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiRating>(null);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset feedback state when session ID changes
  useEffect(() => {
    setSelectedEmoji(null);
    setReviewText("");
    setIsSubmitting(false);
  }, [sessionId]);

  const handleEmojiSelect = (emoji: EmojiRating) => {
    setSelectedEmoji(emoji);
  };

  const handleReviewChange = (text: string) => {
    setReviewText(text);
  };

  const validateSubmission = (): boolean => {
    if (!selectedEmoji) {
      toast({
        title: "Please select an emoji",
        description: "Select how you feel about this consultation before ending the session.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (): Promise<boolean> => {
    if (!validateSubmission()) return false;

    setIsSubmitting(true);
    
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication error",
          description: "You must be logged in to submit feedback.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return false;
      }
      
      // Check if we have a valid session ID
      if (!sessionId) {
        toast({
          title: "Submission error",
          description: "Could not identify the current chat session.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return false;
      }
      
      console.log("Submitting feedback:", {
        userId: session.user.id,
        sessionId: sessionId,
        emoji: selectedEmoji,
        text: reviewText
      });
      
      // Save the feedback to Supabase
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: session.user.id,
          session_id: sessionId,
          emoji_rating: selectedEmoji,
          review_text: reviewText || null
        });

      if (error) {
        console.error("Error submitting feedback:", error);
        toast({
          title: "Submission error",
          description: "There was a problem saving your feedback.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return false;
      }
      
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });
      
      // After saving the feedback, call the onFinish prop
      onFinish();
      return true;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Submission error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return false;
    }
  };

  return {
    selectedEmoji,
    reviewText,
    isSubmitting,
    handleEmojiSelect,
    handleReviewChange,
    handleSubmit
  };
};
