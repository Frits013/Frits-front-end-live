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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CompanyData {
  company_id: string;
  code: number;
  company_name?: string;
}

const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const { toast } = useToast();
  const [companyCode, setCompanyCode] = useState("");
  const [userDescription, setUserDescription] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [isEditingCode, setIsEditingCode] = useState(false);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Query the users table with company code information
      const { data: profile, error } = await supabase
        .from("users")
        .select(`
          user_description,
          TTS_flag,
          company_id
        `)
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        setUserDescription(profile.user_description || "");
        setTtsEnabled(profile.TTS_flag || false);
        
        // If there's a company_id, get the code from company_codes view
        if (profile.company_id) {
          const { data: companyCode } = await supabase
            .from('company_codes')
            .select('code')
            .eq('code', profile.company_id)
            .maybeSingle();
            
          if (companyCode) {
            setCompanyCode(companyCode.code.toString());
          } else {
            setCompanyCode("");
          }
        } else {
          setCompanyCode("");
        }
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

  const validateCompanyCode = async (code: string) => {
    if (!code) return true; // Empty code is allowed
    
    // Make sure code only contains numbers and is at most 8 digits
    if (!/^\d{1,8}$/.test(code)) {
      setCodeError("Company code must be an 8-digit number");
      return false;
    }
    
    setCodeError("");
    
    // Convert string code to number before querying
    const numericCode = parseInt(code);
    
    // Query the company_codes view
    const { data: validCode } = await supabase
      .from('company_codes')
      .select('code')
      .eq('code', numericCode)
      .maybeSingle();

    if (!validCode) {
      setCodeError("Company code not found");
      return false;
    }
    
    return true;
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

      // If editing code, validate and update company_id
      if (isEditingCode) {
        // Validate company code if provided
        if (companyCode && !(await validateCompanyCode(companyCode))) {
          setIsLoading(false);
          return;
        }

        if (companyCode) {
          const { data: success, error: functionError } = await supabase
            .rpc('set_user_company', {
              user_uuid: session.user.id,
              company_code: companyCode
            });

          if (functionError) throw functionError;
          if (!success) {
            setCodeError("Failed to link company code");
            setIsLoading(false);
            return;
          }
        } else {
          // If no company code provided, remove company association
          const { error: updateError } = await supabase
            .from("users")
            .update({ company_id: null })
            .eq("user_id", session.user.id);

          if (updateError) throw updateError;
        }
      }

      // Update other user fields
      const { error } = await supabase
        .from("users")
        .update({
          user_description: userDescription,
          TTS_flag: ttsEnabled
        })
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      setIsEditingCode(false);
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
      setIsEditingCode(false);
      setCodeError("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="companyCode">Company Code</Label>
            {isEditingCode ? (
              <div className="space-y-2">
                <Input
                  id="companyCode"
                  value={companyCode}
                  onChange={(e) => {
                    // Only allow numeric input with max 8 digits
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setCompanyCode(value);
                    setCodeError("");
                  }}
                  className="w-full font-mono"
                  placeholder="Enter 8-digit company code"
                  maxLength={8}
                  inputMode="numeric"
                />
                {codeError && (
                  <p className="text-sm text-destructive">{codeError}</p>
                )}
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditingCode(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={async () => {
                      if (await validateCompanyCode(companyCode)) {
                        setIsEditingCode(false);
                      }
                    }}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Input
                  id="companyCode"
                  value={companyCode}
                  disabled
                  className="w-full font-mono bg-muted"
                />
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditingCode(true)}
                >
                  Edit
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="userDescription">Personal Summary</Label>
            <Textarea
              id="userDescription"
              value={userDescription}
              onChange={(e) => setUserDescription(e.target.value)}
              className="min-h-[250px] resize-y w-full"
              placeholder="You can provide a summary about yourself including your name, role at the company, hobbies, characteristics, and any other relevant information. This helps the AI consultant better understand your background.

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
