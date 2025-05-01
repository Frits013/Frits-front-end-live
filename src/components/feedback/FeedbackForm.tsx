
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import EmojiRatingSelector, { EmojiRating } from "./EmojiRatingSelector";

interface FeedbackFormProps {
  selectedEmoji: EmojiRating;
  reviewText: string;
  onEmojiSelect: (emoji: EmojiRating) => void;
  onReviewChange: (text: string) => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  selectedEmoji,
  reviewText,
  onEmojiSelect,
  onReviewChange,
}) => {
  return (
    <div className="space-y-4">
      <EmojiRatingSelector 
        selectedEmoji={selectedEmoji} 
        onEmojiSelect={onEmojiSelect} 
      />
      
      {selectedEmoji && (
        <div className="mt-2 animate-in fade-in slide-in-from-top duration-300">
          <Textarea
            placeholder="Share your feedback about this consultation session..."
            value={reviewText}
            onChange={(e) => onReviewChange(e.target.value)}
            className="w-full min-h-[100px]"
          />
        </div>
      )}
    </div>
  );
};

export default FeedbackForm;
