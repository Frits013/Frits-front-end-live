
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
import { Textarea } from "@/components/ui/textarea";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const { toast } = useToast();
  const [companyInfo, setCompanyInfo] = useState("");
  const [name, setName] = useState("");
  const [technicalLevel, setTechnicalLevel] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        setCompanyInfo(profile.company_info || "");
        setName(profile.name || "");
        setTechnicalLevel(profile.technical_level || "");
        setRoleDescription(profile.role_description || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
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
          company_info: companyInfo,
          name,
          technical_level: technicalLevel || null,
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
      <DialogContent className="sm:max-w-[600px]">
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
            <Label htmlFor="companyInfo">
              Company Info
              <span className="block text-sm text-muted-foreground">
                Max 500 words
              </span>
            </Label>
            <Textarea
              id="companyInfo"
              value={companyInfo}
              onChange={(e) => setCompanyInfo(e.target.value)}
              className="min-h-[200px]"
              placeholder="Create a headstart by providing more information about your organization! Example topics to help Frits make a more personal consult are AI strategy, company culture, employee's AI skills, data quality/availability, hardware, governance processes, and competitive environment."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="technicalLevel" className="flex flex-col">
              <span>Technical Level</span>
              <span className="text-sm text-muted-foreground">
                Scale: 1 (new to AI adoption) to 5 (expert in AI adoption)
              </span>
            </Label>
            <Select
              value={technicalLevel}
              onValueChange={setTechnicalLevel}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your technical level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
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
