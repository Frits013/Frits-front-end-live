
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResendConfirmationForm } from "@/components/auth/ResendConfirmationForm";
import { CustomLoginForm } from "@/components/auth/CustomLoginForm";
import { Github, Mail, UserPlus, LogIn, ArrowRight } from "lucide-react";
import { useAuthOperations } from "@/hooks/use-auth-operations";

export const AuthContent = () => {
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up'>('sign_in');
  const { handleSignInWithGithub } = useAuthOperations();

  const toggleAuthView = () => {
    setAuthView(authView === 'sign_in' ? 'sign_up' : 'sign_in');
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Enhanced header with distinct styling for each mode */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          {authView === 'sign_in' ? (
            <LogIn className="h-6 w-6 text-blue-600" />
          ) : (
            <UserPlus className="h-6 w-6 text-emerald-600" />
          )}
          <h1 className={`text-2xl font-bold ${authView === 'sign_in' ? 'text-blue-900' : 'text-emerald-900'}`}>
            {authView === 'sign_in' ? 'Welcome back' : 'Join Frits AI'}
          </h1>
        </div>
        <p className={`text-sm ${authView === 'sign_in' ? 'text-blue-600' : 'text-emerald-600'}`}>
          {authView === 'sign_in' 
            ? 'Continue your AI transformation journey' 
            : 'Start your AI readiness assessment today'}
        </p>
      </div>
      
      {/* Mode toggle buttons - more prominent */}
      <div className={`flex rounded-lg p-1 ${authView === 'sign_in' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
        <button
          onClick={() => setAuthView('sign_in')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            authView === 'sign_in'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-blue-600 hover:bg-blue-100'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setAuthView('sign_up')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            authView === 'sign_up'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-emerald-600 hover:bg-emerald-100'
          }`}
        >
          Sign Up
        </button>
      </div>
      
      {/* Social login buttons with theme-appropriate styling - removed Google */}
      <div className="flex flex-col space-y-3">
        <Button
          variant="outline"
          onClick={handleSignInWithGithub}
          className={`w-full flex items-center justify-center gap-2 border-2 transition-all duration-200 ${
            authView === 'sign_in' 
              ? 'border-blue-200 hover:border-blue-300 hover:bg-blue-50' 
              : 'border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50'
          }`}
        >
          <Github className="h-4 w-4" />
          {authView === 'sign_in' ? 'Sign in with GitHub' : 'Sign up with GitHub'}
        </Button>
      </div>
      
      {/* Enhanced divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className={`w-full border-t ${authView === 'sign_in' ? 'border-blue-200' : 'border-emerald-200'}`} />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className={`bg-white px-3 py-1 rounded-full text-xs font-medium ${
            authView === 'sign_in' ? 'text-blue-600' : 'text-emerald-600'
          }`}>
            Or continue with email
          </span>
        </div>
      </div>
      
      <CustomLoginForm authView={authView} />
      
      {/* Enhanced footer section - removed the alternative action prompts */}
      <div className="text-center space-y-3 text-sm">
        {authView === 'sign_in' && (
          <Button variant="link" className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto font-medium">
            Forgot your password?
          </Button>
        )}
      </div>
      
      <ResendConfirmationForm />
    </div>
  );
};
