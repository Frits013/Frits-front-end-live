import React from "react";
import { Button } from "@/components/ui/button";
import { ResendConfirmationForm } from "@/components/auth/ResendConfirmationForm";
import { CustomLoginForm } from "@/components/auth/CustomLoginForm";
import { LogIn } from "lucide-react";
export const AuthContent = () => {
  return <div className="flex flex-col space-y-6">
      {/* Header for sign in only */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <LogIn className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-blue-900">Welcome!</h1>
        </div>
        
      </div>
      
      <CustomLoginForm authView="sign_in" />
      
      {/* Footer section */}
      <div className="text-center space-y-3 text-sm">
        <Button variant="link" className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto font-medium">
          Forgot your password?
        </Button>
      </div>
      
      <ResendConfirmationForm />
    </div>;
};