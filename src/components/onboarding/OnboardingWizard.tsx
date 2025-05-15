
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[600px]">
        <div className="grid gap-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Welcome!</h2>
            <div className="text-sm text-muted-foreground">
              Step {step} of 3
            </div>
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600 mr-2" />
                <h3 className="text-xl font-medium">About Frits</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <p>
                  Welcome to Frits - Your AI Readiness assessor
                </p>
                <p>
                  Frits is your personal assistant for assessing how prepared your organization is for using AI. In just 20 minutes, he helps you:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Identify opportunities for AI adoption</li>
                  <li>Spot gaps or challenges in your current approach</li>
                  <li>Understand next steps, tailored to your experience level</li>
                </ul>
                <p className="font-medium mt-2">
                  What to expect:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Frits asks short, easy-to-follow questions</li>
                  <li>He adapts to your knowledge – no AI background needed</li>
                  <li>Just type your goal or question to begin</li>
                </ul>
                <p className="font-medium mt-2">
                  Good to know:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>First response may take up to 2 minutes</li>
                  <li>After that, replies arrive in about 20 seconds</li>
                  <li>Frits knows his role well – feel free to ask anything</li>
                </ul>
                <p className="font-medium mt-2">
                  Start your session by simply saying what you'd like help with!
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleNext}>
                  Next
                </Button>
              </div>
            </div>
          ) : step === 2 ? (
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
                    setError("");
                  }}
                  className="font-mono"
                  maxLength={8}
                  inputMode="numeric"
                />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrevious}>
                  Previous
                </Button>
                <Button onClick={handleNext}>
                  {companyCode.length > 0 ? "Next" : "Skip"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Tell Us About Yourself</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please provide a brief description about yourself, including your role, expertise, and interests.
                  This step is optional.
                </p>
                <Textarea
                  placeholder="Enter your description..."
                  value={userDescription}
                  onChange={(e) => setUserDescription(e.target.value)}
                  className="min-h-[200px]"
                />
                <p className="text-sm text-muted-foreground mt-2 italic">
                  PRO TIP: Ask ChatGPT to make a summary about yourself. Specifically a summary which an AI readiness consultant can use to prepare itself for an interview. Paste the answer here.
                </p>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
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
