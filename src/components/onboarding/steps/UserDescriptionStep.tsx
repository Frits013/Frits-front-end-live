
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
        <p className="text-sm text-muted-foreground mt-2 italic">
          PRO TIP: Ask ChatGPT to make a summary about yourself. Specifically a summary which an AI readiness consultant can use to prepare itself for an interview. Paste the answer here.
        </p>
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
