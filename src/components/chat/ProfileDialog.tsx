
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

      const { data: profile, error } = await supabase
        .from("users")
        .select(`
          user_description,
          TTS_flag,
          company_id,
          companies(code)
        `)
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        setUserDescription(profile.user_description || "");
        setTtsEnabled(profile.TTS_flag || false);
        
        // Handle company data
        if (profile.companies) {
          const companyData = profile.companies as CompanyData;
          if (companyData && companyData.code) {
            setCompanyCode(companyData.code.toString());
            console.log("Loaded company code:", companyData.code);
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
    if (!code) return true; // Empty code is allowed (will remove company association)
    
    // Make sure code only contains numbers and is at most 8 digits
    if (!/^\d{1,8}$/.test(code)) {
      setCodeError("Company code must be an 8-digit number");
      return false;
    }
    
    setCodeError("");
    console.log("Validating company code:", code);
    
    // Convert string code to number before querying
    const numericCode = parseInt(code);
    console.log("Converted to numeric code:", numericCode);
    
    const { data: company, error } = await supabase
      .from('companies')
      .select('company_id, code')
      .eq('code', numericCode)
      .maybeSingle();
      
    if (error) {
      console.error('Error validating company code:', error);
      setCodeError("Error checking company code");
      return false;
    }

    console.log("Company search result:", company);

    if (!company) {
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

        let company_id = null;
        if (companyCode) {
          // Look up company_id from the code
          const numericCode = parseInt(companyCode);
          
          const { data: company } = await supabase
            .from('companies')
            .select('company_id')
            .eq('code', numericCode)
            .maybeSingle();

          console.log("Company lookup result:", company);

          if (company) {
            company_id = company.company_id;
          }
        }

        // Update user with the new company_id
        const { error } = await supabase
          .from("users")
          .update({
            user_description: userDescription,
            TTS_flag: ttsEnabled,
            company_id
          })
          .eq("user_id", session.user.id);

        if (error) throw error;
      } else {
        // Not editing code, just update other fields
        const { error } = await supabase
          .from("users")
          .update({
            user_description: userDescription,
            TTS_flag: ttsEnabled
          })
          .eq("user_id", session.user.id);

        if (error) throw error;
      }

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
