
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export const useAuthOperations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEmailConfirmed, setIsEmailConfirmed] = useState<boolean>(false);

  // Check email confirmation status on mount and when auth state changes
  useEffect(() => {
    checkEmailConfirmation();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkEmailConfirmation();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkEmailConfirmation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const isConfirmed = user.email_confirmed_at !== null;
        setIsEmailConfirmed(isConfirmed);
        return isConfirmed;
      }
      
      setIsEmailConfirmed(false);
      return false;
    } catch (error) {
      console.error("Error checking email confirmation:", error);
      setIsEmailConfirmed(false);
      return false;
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleSignInWithGithub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error('GitHub sign in error:', error);
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('GitHub sign in exception:', error);
      toast({
        title: "Sign In Failed",
        description: "An unexpected error occurred during GitHub sign in.",
        variant: "destructive",
      });
    }
  };

  const handleEmailSignUp = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign up with email:", email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (error) {
        console.error('Email sign up error:', error);
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      console.log("Sign up successful:", data);
      
      // Check if we received a confirmation flow
      if (data?.user && !data.user.email_confirmed_at) {
        toast({
          title: "Almost There!",
          description: "Please check your email for a confirmation link. You'll need to verify your email before signing in.",
          duration: 8000,
        });
      } else {
        toast({
          title: "Sign Up Successful",
          description: "Your account has been created successfully!",
          duration: 6000,
        });
      }
      
      return { data };
    } catch (error) {
      console.error('Email sign up exception:', error);
      toast({
        title: "Sign Up Failed",
        description: "An unexpected error occurred during sign up.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Email sign in error:', error);
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Check if email is confirmed
      const isConfirmed = await checkEmailConfirmation();
      
      if (!isConfirmed) {
        toast({
          title: "Email Not Confirmed",
          description: "Please check your email and confirm your account before signing in.",
          variant: "destructive", 
          duration: 6000,
        });
        
        // Sign out the user if their email isn't confirmed
        await supabase.auth.signOut();
        return { error: { message: "Email not confirmed" } };
      }

      toast({
        title: "Sign In Successful",
        description: "You've been signed in successfully!",
      });
      
      return { data };
    } catch (error) {
      console.error('Email sign in exception:', error);
      toast({
        title: "Sign In Failed",
        description: "An unexpected error occurred during sign in.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const resendConfirmationEmail = async (email: string) => {
    try {
      console.log("Attempting to resend confirmation email to:", email);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (error) {
        console.error("Failed to resend confirmation email:", error);
        toast({
          title: "Failed to Resend",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      console.log("Confirmation email resent successfully");
      toast({
        title: "Email Sent",
        description: "Confirmation email has been resent. Please check your inbox.",
        duration: 6000,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Resend confirmation exception:', error);
      toast({
        title: "Failed to Resend",
        description: "An unexpected error occurred when resending the confirmation email.",
        variant: "destructive",
      });
      return { error };
    }
  };

  return {
    handleSignOut,
    handleSignInWithGithub,
    handleEmailSignUp,
    handleEmailSignIn,
    resendConfirmationEmail,
    isEmailConfirmed,
    checkEmailConfirmation,
  };
};
