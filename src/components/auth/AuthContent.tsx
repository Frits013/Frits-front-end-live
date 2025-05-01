
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResendConfirmationForm } from "@/components/auth/ResendConfirmationForm";
import { CustomLoginForm } from "@/components/auth/CustomLoginForm";
import { Github, Mail } from "lucide-react";
import { useAuthOperations } from "@/hooks/use-auth-operations";

export const AuthContent = () => {
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up'>('sign_in');
  const { handleSignInWithGithub } = useAuthOperations();

  const toggleAuthView = () => {
    setAuthView(authView === 'sign_in' ? 'sign_up' : 'sign_in');
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-1">
          {authView === 'sign_in' ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="text-muted-foreground">
          {authView === 'sign_in' 
            ? 'Sign in to your account to continue' 
            : 'Sign up for an account to get started'}
        </p>
      </div>
      
      <div className="flex flex-col space-y-3">
        <Button
          variant="outline"
          onClick={handleSignInWithGithub}
          className="w-full flex items-center justify-center gap-2"
        >
          <Github className="h-4 w-4" />
          Sign in with GitHub
        </Button>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">Or continue with email</span>
        </div>
      </div>
      
      <CustomLoginForm authView={authView} />
      
      <div className="text-center space-y-2 text-sm">
        {authView === 'sign_in' && (
          <Button variant="link" className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto">
            Forgot your password?
          </Button>
        )}
        <div className="flex justify-center">
          <span className="text-muted-foreground mr-1">
            {authView === 'sign_in' ? "Don't have an account?" : "Already have an account?"}
          </span>
          <Button 
            variant="link" 
            className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto"
            onClick={toggleAuthView}
          >
            {authView === 'sign_in' ? 'Sign up' : 'Sign in'}
          </Button>
        </div>
      </div>
      
      {authView === 'sign_in' && <ResendConfirmationForm />}
    </div>
  );
};
