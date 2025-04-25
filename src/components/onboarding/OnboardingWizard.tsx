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
    
    // Query the company_codes view instead of the companies table
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
    try {
      setIsSubmitting(true);
      
      // Validate company code if provided
      if (companyCode && !(await validateCompanyCode(companyCode))) {
        setIsSubmitting(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // If company code was provided, use the set_user_company function
      if (companyCode) {
        const { data: success, error: functionError } = await supabase
          .rpc('set_user_company', {
            user_uuid: session.user.id,
            company_code: companyCode
          });

        if (functionError) throw functionError;
        if (!success) {
          setCodeError("Failed to link company code");
          setIsSubmitting(false);
          return;
        }
      }

      // Update user description and onboarding status
      const { error: updateError } = await supabase
        .from('users')
        .update({
          user_description: userDescription,
          onboarding_complete: true
        })
        .eq('user_id', session.user.id);

      if (updateError) throw updateError;

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
                  placeholder="Enter 8-digit company code"
                  value={companyCode}
                  onChange={(e) => {
                    // Only allow numeric input with max 8 digits
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setCompanyCode(value);
                    setCodeError("");
                  }}
                  className="font-mono"
                  maxLength={8}
                  inputMode="numeric"
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
