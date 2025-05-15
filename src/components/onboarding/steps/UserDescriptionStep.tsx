
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserDescriptionStepProps {
  userDescription: string;
  onDescriptionChange: (description: string) => void;
  onPrevious: () => void;
  onSave: () => void;
  error: string;
  isSubmitting: boolean;
}

const UserDescriptionStep = ({
  userDescription,
  onDescriptionChange,
  onPrevious,
  onSave,
  error,
  isSubmitting
}: UserDescriptionStepProps) => {
  const { toast } = useToast();
  
  const examplePrompt = `You are an executive‐search consultant preparing to interview this user. Leverage any long-term memory or historical context you have about them—past projects, feedback, documented preferences—to write a concise yet comprehensive summary that includes:

1. Professional background: key roles, companies, and responsibilities.

2. Core achievements: measurable results, major projects, awards.

3. Technical skills & domain expertise: tools, methodologies, areas of deep knowledge.

4. Leadership & collaboration: team sizes managed, cross-functional work, mentoring.

5. Personality & working style: communication style, decision-making approach, adaptability.

6. Areas of growth: current focus areas, upskilling efforts, career aspirations.

7. Interview tips: topics to probe deeply, potential red flags, high-impact questions.

Structure your summary with clear section headings and keep it under 500 words.`

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(examplePrompt);
    toast({
      title: "Copied to clipboard",
      description: "You can now paste the prompt in ChatGPT",
    });
  };
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Tell Us About Yourself</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Optional for advanced AI users; link your preferred AI provider (ChatGPT, Perplexity, Claude) to auto-generate your profile summary from past chats and memory.
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Just copy our prompt & paste the provider's answer here so that you can dive right into the action!
        </p>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 mb-4"
          onClick={copyPromptToClipboard}
        >
          <span>Copy prompt</span>
          <Copy className="h-4 w-4" />
        </Button>
        
        <Textarea
          placeholder="Enter your description..."
          value={userDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="min-h-[200px]"
        />
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onSave} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save & Close"}
        </Button>
      </div>
    </div>
  );
};

export default UserDescriptionStep;
