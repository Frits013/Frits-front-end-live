
import React, { useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ResendConfirmationForm } from "@/components/auth/ResendConfirmationForm";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

export const AuthContent = () => {
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up'>('sign_in');

  const toggleAuthView = () => {
    setAuthView(authView === 'sign_in' ? 'sign_up' : 'sign_in');
  };

  return (
    <>
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#3b82f6',
                brandAccent: '#2563eb',
              },
            },
          },
          style: {
            anchor: {
              display: 'inline-flex', 
            },
            message: {
              margin: '0',
            },
          },
        }}
        providers={[]}
        view={authView}
        redirectTo={window.location.origin}
      />
      
      <Button 
        variant="outline" 
        className="w-full bg-white text-blue-600 border-blue-200 hover:bg-blue-50 mt-2"
        onClick={toggleAuthView}
      >
        {authView === 'sign_in' ? 'Sign up' : 'Sign in'}
      </Button>
      
      <ResendConfirmationForm />
      <SocialLoginButtons />
    </>
  );
};
