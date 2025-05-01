
import React from "react";
import { Angry, Meh, Smile, Flame } from "lucide-react";

export type EmojiRating = "happy" | "angry" | "meh" | "fire" | null;

interface EmojiRatingSelectorProps {
  selectedEmoji: EmojiRating;
  onEmojiSelect: (emoji: EmojiRating) => void;
}

const EmojiRatingSelector: React.FC<EmojiRatingSelectorProps> = ({
  selectedEmoji,
  onEmojiSelect,
}) => {
  return (
    <div className="flex justify-between items-center py-4">
      <button 
        onClick={() => onEmojiSelect("angry")}
        className={`p-2 rounded-full ${selectedEmoji === "angry" ? "bg-red-100 ring-2 ring-red-500" : "hover:bg-gray-100"} transition-all`}
        aria-label="Angry"
        title="Angry"
      >
        <Angry className={`h-8 w-8 ${selectedEmoji === "angry" ? "text-red-500" : "text-gray-500"}`} />
      </button>
      
      <button 
        onClick={() => onEmojiSelect("meh")}
        className={`p-2 rounded-full ${selectedEmoji === "meh" ? "bg-blue-100 ring-2 ring-blue-500" : "hover:bg-gray-100"} transition-all`}
        aria-label="Meh/Indifferent"
        title="Meh/Indifferent"
      >
        <Meh className={`h-8 w-8 ${selectedEmoji === "meh" ? "text-blue-500" : "text-gray-500"}`} />
      </button>
      
      <button 
        onClick={() => onEmojiSelect("happy")}
        className={`p-2 rounded-full ${selectedEmoji === "happy" ? "bg-green-100 ring-2 ring-green-500" : "hover:bg-gray-100"} transition-all`}
        aria-label="Happy"
        title="Happy"
      >
        <Smile className={`h-8 w-8 ${selectedEmoji === "happy" ? "text-green-500" : "text-gray-500"}`} />
      </button>
      
      <button 
        onClick={() => onEmojiSelect("fire")}
        className={`p-2 rounded-full ${selectedEmoji === "fire" ? "bg-orange-100 ring-2 ring-orange-500" : "hover:bg-gray-100"} transition-all`}
        aria-label="Fire/Amazing"
        title="Fire/Amazing"
      >
        <Flame className={`h-8 w-8 ${selectedEmoji === "fire" ? "text-orange-500" : "text-gray-500"}`} />
      </button>
    </div>
  );
};

export default EmojiRatingSelector;
