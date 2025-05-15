
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Tell Us About Yourself</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Please provide a brief description about yourself, including your role, expertise, and interests.
          This step is optional.
        </p>
        <Textarea
          placeholder="Enter your description..."
          value={userDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="min-h-[200px]"
        />
        
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="mt-2"
        >
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              Example ChatGPT prompt
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <p className="text-sm text-muted-foreground italic border-l-2 border-muted pl-4 py-2">
              "You are an executive‐search consultant preparing to interview [Your Name], a [Your Current Job Title] with [X] years of experience in [Your Industry or Specialization]. Leverage any long-term memory or historical context you have about [Your Name] (e.g. past projects, past feedback, documented preferences) to enrich this summary. Please write a concise yet comprehensive summary of [Your Name] that covers:

              Professional background: key roles, companies, and responsibilities.

              Core achievements: measurable results, major projects, awards.

              Technical skills & domain expertise: tools, methodologies, areas of deep knowledge.

              Leadership & collaboration: team size managed, cross-functional work, mentoring.

              Personality & working style: communication style, decision-making approach, adaptability.

              Areas of growth: current focus areas, upskilling efforts, career aspirations.

              Interview tips: topics the consultant should probe, potential red flags to watch, high-impact questions.

              Structure the summary in clear sections with headings, and keep it under 500 words."
            </p>
          </CollapsibleContent>
        </Collapsible>
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
