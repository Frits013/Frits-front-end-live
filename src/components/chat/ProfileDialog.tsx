
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [name, setName] = useState("");
  const [technicalLevel, setTechnicalLevel] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      setDisplayName(profile.display_name || "");
      setName(profile.name || "");
      setTechnicalLevel(profile.technical_level || "");
      setRoleDescription(profile.role_description || "");
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to update your profile",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          display_name: displayName,
          name,
          technical_level: technicalLevel,
          role_description: roleDescription,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="technicalLevel">Technical Level</Label>
            <Select
              value={technicalLevel}
              onValueChange={setTechnicalLevel}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your technical level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="junior">Junior</SelectItem>
                <SelectItem value="medior">Medior</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="roleDescription">Role Description</Label>
            <Input
              id="roleDescription"
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
