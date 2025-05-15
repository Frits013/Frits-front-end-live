import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import WelcomeStep from "./steps/WelcomeStep";
import CompanyCodeStep from "./steps/CompanyCodeStep";
import UserDescriptionStep from "./steps/UserDescriptionStep";

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
  const [error, setError] = useState("");

  const handleNext = () => {
    setError("");
    setStep(prevStep => prevStep + 1);
  };
  
  const handlePrevious = () => {
    setError("");
    setStep(prevStep => prevStep - 1);
  };

  const validateCompanyCode = async (code: string) => {
    if (!code) return true; // Empty code is allowed (will not link to company)
    
    // Make sure code only contains numbers and is at most 8 digits
    if (!/^\d{1,8}$/.test(code)) {
      setError("Company code must be an 8-digit number");
      return false;
    }
    
    console.log("Validating company code:", code);
    
    // Convert string code to number before querying
    const numericCode = parseInt(code);
    console.log("Converted to numeric code:", numericCode);
    
    // Query the company_codes view to check if code exists
    const { data: validCode } = await supabase
      .from('company_codes')
      .select('code')
      .eq('code', numericCode)
      .maybeSingle();

    if (!validCode) {
      setError("Company code not found");
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    try {
      setError("");
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
          setError("Failed to link company code");
          setIsSubmitting(false);
          return;
        }
      }

      // Update user description and onboarding status
      // Note: We don't validate userDescription - it can be empty
      const { error: updateError } = await supabase
        .from('users')
        .update({
          user_description: userDescription || null, // Use null if empty string
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
      setError("Failed to save your profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Get the appropriate header title based on current step
  const getHeaderTitle = () => {
    switch(step) {
      case 1:
        return "Welcome to Frits! - Your AI Readiness assessor";
      case 2:
        return "Company Code";
      case 3:
        return "Take the fast lane [optional]";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent hideCloseButton={true} className="sm:max-w-[800px]">
        <div className="grid gap-4 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">{getHeaderTitle()}</h2>
            <div className="text-sm text-muted-foreground">
              Step {step} of 3
            </div>
          </div>

          {step === 1 ? (
            <WelcomeStep onNext={handleNext} />
          ) : step === 2 ? (
            <CompanyCodeStep 
              companyCode={companyCode}
              onCompanyCodeChange={(code) => {
                setCompanyCode(code);
                setError("");
              }}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          ) : (
            <UserDescriptionStep 
              userDescription={userDescription}
              onDescriptionChange={setUserDescription}
              onPrevious={handlePrevious}
              onSave={handleSave}
              error={error}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;
