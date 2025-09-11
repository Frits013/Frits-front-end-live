
import React from "react";
import { ResendConfirmationForm } from "@/components/auth/ResendConfirmationForm";
import { CustomLoginForm } from "@/components/auth/CustomLoginForm";
import { LogIn } from "lucide-react";

export const AuthContent = () => {
  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <LogIn className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-blue-900">
            Welcome back
          </h1>
        </div>
        <p className="text-sm text-blue-600">
          Access restricted to authorized users only
        </p>
      </div>
      
      {/* Email sign in form */}
      <CustomLoginForm />
      
      {/* Footer section */}
      <div className="text-center space-y-3 text-sm">
        <p className="text-xs text-gray-500">
          Access by invitation only
        </p>
      </div>
      
      <ResendConfirmationForm />
    </div>
  );
};
