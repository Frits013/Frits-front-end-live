
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthOperations } from "@/hooks/use-auth-operations";

export const ResendConfirmationForm = () => {
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();
  const { resendConfirmationEmail } = useAuthOperations();

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsResending(true);
    try {
      const result = await resendConfirmationEmail(resendEmail);
      console.log("Resend result:", result);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <h3 className="text-sm font-medium mb-2">Didn't receive confirmation email?</h3>
      <form onSubmit={handleResendConfirmation} className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="resend-email">Email</Label>
          <Input
            id="resend-email"
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        <Button 
          type="submit" 
          variant="secondary"
          className="w-full"
          disabled={isResending}
        >
          {isResending ? "Sending..." : "Resend Confirmation Email"}
        </Button>
      </form>
    </div>
  );
};
