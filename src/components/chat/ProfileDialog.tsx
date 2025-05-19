
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CompanyCodeField from "../profile/CompanyCodeField";
import { useProfile } from "@/hooks/use-profile";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const [isEditingCode, setIsEditingCode] = useState(false);
  const {
    companyCode,
    setCompanyCode,
    userDescription,
    setUserDescription,
    ttsEnabled,
    setTtsEnabled,
    isLoading,
    codeError,
    setCodeError,
    loadProfile,
    saveProfile,
  } = useProfile();
  const { toast } = useToast();

  // Example prompt for generating a user description
  const examplePrompt = `You are an executive‐search consultant preparing to interview this user. Leverage any long-term memory or historical context you have about them—past projects, feedback, documented preferences—to write a concise yet comprehensive summary that includes:

1. Professional background: key roles, companies, and responsibilities.

2. Core achievements: measurable results, major projects, awards.

3. Technical skills & domain expertise: tools, methodologies, areas of deep knowledge.

4. Leadership & collaboration: team sizes managed, cross-functional work, mentoring.

5. Personality & working style: communication style, decision-making approach, adaptability.

6. Areas of growth: current focus areas, upskilling efforts, career aspirations.

7. Interview tips: topics to probe deeply, potential red flags, high-impact questions.

Structure your summary with clear section headings and keep it under 500 words.`;

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(examplePrompt);
    toast({
      title: "Copied to clipboard",
      description: "You can now paste the prompt in ChatGPT",
    });
  };

  useEffect(() => {
    if (open) {
      loadProfile();
      setIsEditingCode(false);
      setCodeError("");
    }
  }, [open]);

  const handleSave = async () => {
    const success = await saveProfile(isEditingCode);
    if (success) {
      setIsEditingCode(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <CompanyCodeField
            companyCode={companyCode}
            isEditingCode={isEditingCode}
            codeError={codeError}
            onCodeChange={(value) => {
              setCompanyCode(value);
              setCodeError("");
            }}
            onEditClick={() => setIsEditingCode(true)}
            onCancelEdit={() => setIsEditingCode(false)}
            onConfirmEdit={() => setIsEditingCode(false)}
          />
          
          <div className="grid gap-2">
            <Label htmlFor="userDescription">Personal Summary</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Advanced AI user? Generate a profile from past chats with your favorite provider (ChatGPT, Perplexity, Claude).
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 mb-4 w-fit"
              onClick={copyPromptToClipboard}
            >
              <span>Copy prompt</span>
              <Copy className="h-4 w-4" />
            </Button>
            <Textarea
              id="userDescription"
              value={userDescription}
              onChange={(e) => setUserDescription(e.target.value)}
              className="min-h-[250px] resize-y w-full"
              placeholder="You can provide a summary about yourself including your name, role at the company, hobbies, characteristics, and any other relevant information. This helps Frits the AI consultant in personalizing your experience."
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="tts"
              checked={ttsEnabled}
              onCheckedChange={setTtsEnabled}
            />
            <Label htmlFor="tts">Enable audio responses (working on for next version)</Label>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            type="button"
          >
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
