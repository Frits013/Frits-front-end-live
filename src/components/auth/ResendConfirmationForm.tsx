
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthOperations } from "@/hooks/use-auth-operations";
import { Mail } from "lucide-react";

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
      <h3 className="text-sm font-medium mb-2 text-center">Didn't receive confirmation email?</h3>
      <form onSubmit={handleResendConfirmation} className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="resend-email" className="sr-only">Email</Label>
          <div className="relative">
            <Input
              id="resend-email"
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="Enter your email"
              className="pl-10"
              required
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
        </div>
        <Button 
          type="submit" 
          variant="outline"
          className="w-full"
          disabled={isResending}
        >
          {isResending ? "Sending..." : "Resend Confirmation Email"}
        </Button>
      </form>
    </div>
  );
};
