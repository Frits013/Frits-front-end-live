
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

const OnboardingWizard = ({ open, onComplete }: OnboardingWizardProps) => {
  const [step, setStep] = useState(1);
  const [companyCode, setCompanyCode] = useState("");
  const [userDescription, setUserDescription] = useState("");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeError, setCodeError] = useState("");

  const handleNext = () => setStep(2);
  const handlePrevious = () => setStep(1);

  const validateCompanyCode = async (code: string) => {
    if (!code) return true; // Empty code is allowed (will not link to company)
    
    setCodeError("");
    console.log("Validating company code:", code);
    
    const { data: company, error } = await supabase
      .from('companies')
      .select('company_id')
      .eq('code', code.trim())
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
    try {
      setIsSubmitting(true);
      
      // Validate company code if provided
      if (companyCode && !(await validateCompanyCode(companyCode))) {
        setIsSubmitting(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let company_id = null;

      // If company code was provided, retrieve the company ID
      if (companyCode) {
        console.log("Looking up company with code:", companyCode);
        const { data: company } = await supabase
          .from('companies')
          .select('company_id')
          .eq('code', companyCode.trim())
          .maybeSingle();

        console.log("Company lookup result:", company);

        if (company) {
          company_id = company.company_id;
        }
      }

      // Update user profile
      const { error } = await supabase
        .from('users')
        .update({
          user_description: userDescription,
          company_id,
          onboarding_complete: true
        })
        .eq('user_id', session.user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[600px]">
        <div className="grid gap-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Welcome!</h2>
            <div className="text-sm text-muted-foreground">
              Step {step} of 2
            </div>
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Company Code</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  If you have an 8-digit company code, enter it below. Otherwise, you can skip this step.
                </p>
                <Input
                  placeholder="Enter company code"
                  value={companyCode}
                  onChange={(e) => {
                    setCompanyCode(e.target.value.slice(0, 8).toUpperCase());
                    setCodeError("");
                  }}
                  className="font-mono"
                  maxLength={8}
                />
                {codeError && (
                  <p className="text-sm text-destructive mt-2">{codeError}</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={handleNext}>Next</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Tell Us About Yourself</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please provide a brief description about yourself, including your role, expertise, and interests.
                </p>
                <Textarea
                  placeholder="Enter your description..."
                  value={userDescription}
                  onChange={(e) => setUserDescription(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrevious}>
                  Previous
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save & Close"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;
