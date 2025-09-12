import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import WelcomeStep from "./steps/WelcomeStep";
import UserDescriptionStep from "./steps/UserDescriptionStep";

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

const OnboardingWizard = ({ open, onComplete }: OnboardingWizardProps) => {
  const [step, setStep] = useState(1);
  const [userDescription, setUserDescription] = useState("");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load saved onboarding state from localStorage
  useEffect(() => {
    if (open) {
      const savedStep = localStorage.getItem('onboarding_step');
      const savedUserDescription = localStorage.getItem('onboarding_user_description');
      
      if (savedStep) setStep(parseInt(savedStep));
      if (savedUserDescription) setUserDescription(savedUserDescription);
    }
  }, [open]);

  // Save step to localStorage
  useEffect(() => {
    if (open) {
      localStorage.setItem('onboarding_step', step.toString());
    }
  }, [step, open]);

  // Save user description to localStorage
  useEffect(() => {
    if (open) {
      if (userDescription) {
        localStorage.setItem('onboarding_user_description', userDescription);
      } else {
        localStorage.removeItem('onboarding_user_description');
      }
    }
  }, [userDescription, open]);

  const handleNext = () => {
    setError("");
    setStep(prevStep => prevStep + 1);
  };
  
  const handlePrevious = () => {
    setError("");
    setStep(prevStep => prevStep - 1);
  };


  const handleSave = async () => {
    try {
      setError("");
      setIsSubmitting(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

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
      
      // Clear saved onboarding state
      localStorage.removeItem('onboarding_step');
      localStorage.removeItem('onboarding_user_description');
      
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
              Step {step} of 2
            </div>
          </div>

          {step === 1 ? (
            <WelcomeStep onNext={handleNext} />
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
