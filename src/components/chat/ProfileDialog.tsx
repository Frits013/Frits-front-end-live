
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
            <Textarea
              id="userDescription"
              value={userDescription}
              onChange={(e) => setUserDescription(e.target.value)}
              className="min-h-[250px] resize-y w-full"
              placeholder="You can provide a summary about yourself including your name, role at the company, hobbies, characteristics, and any other relevant information. This helps Frits the AI consultant in personalizing your experience.

PRO TIP: Ask ChatGPT to write a summary of you with detailed information that a consultant can read to prepare for an interview."
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="tts"
              checked={ttsEnabled}
              onCheckedChange={setTtsEnabled}
            />
            <Label htmlFor="tts">Enable audio responses</Label>
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
