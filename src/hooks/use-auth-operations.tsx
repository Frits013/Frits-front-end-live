import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";

export const useAuthOperations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEmailConfirmed, setIsEmailConfirmed] = useState<boolean>(false);
  const isCheckingRef = useRef<boolean>(false);
  const emailConfirmationCache = useRef<Record<string, boolean>>({});
  const signInInProgressRef = useRef<boolean>(false);

  // Check email confirmation status on mount and when auth state changes
  useEffect(() => {
    // Set up auth state listener FIRST (best practice)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && !isCheckingRef.current) {
        // Don't run other Supabase functions directly inside the callback
        // Use setTimeout to avoid Supabase deadlocks
        setTimeout(() => {
          checkEmailConfirmation();
        }, 0);
      }
      
      // Reset sign in progress when signed out
      if (event === 'SIGNED_OUT') {
        signInInProgressRef.current = false;
        // Clear email confirmation cache on sign out
        emailConfirmationCache.current = {};
      }
    });

    // THEN check for existing session (best practice order)
    checkEmailConfirmation();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkEmailConfirmation = async () => {
    try {
      // Prevent multiple simultaneous checks
      if (isCheckingRef.current) {
        return isEmailConfirmed;
      }

      isCheckingRef.current = true;
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsEmailConfirmed(false);
        isCheckingRef.current = false;
        return false;
      }
      
      // Use cached result if we've checked this user recently
      const userEmail = user.email?.toLowerCase();
      if (userEmail && emailConfirmationCache.current[userEmail] !== undefined) {
        isCheckingRef.current = false;
        return emailConfirmationCache.current[userEmail];
      }
      
      console.log("Checking email confirmation for user:", user.email);
      console.log("Email confirmed at:", user.email_confirmed_at);
      
      const isConfirmed = user.email_confirmed_at !== null;
      setIsEmailConfirmed(isConfirmed);
      
      // Cache the result
      if (userEmail) {
        emailConfirmationCache.current[userEmail] = isConfirmed;
      }
      
      isCheckingRef.current = false;
      return isConfirmed;
    } catch (error) {
      console.error("Error checking email confirmation:", error);
      setIsEmailConfirmed(false);
      isCheckingRef.current = false;
      return false;
    }
  };

  // Clear email confirmation cache for a specific user or all users
  const clearEmailConfirmationCache = (email?: string) => {
    if (email) {
      delete emailConfirmationCache.current[email.toLowerCase()];
    } else {
      emailConfirmationCache.current = {};
    }
  };

  const handleSignOut = async () => {
    try {
      // Clear email confirmation cache on sign out
      clearEmailConfirmationCache();
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign Out Failed",
        description: "An error occurred while signing out. Please try again.",
        variant: "destructive",
      });
    }
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

  const handleSignInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error('Google sign in error:', error);
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Google sign in exception:', error);
      toast({
        title: "Sign In Failed",
        description: "An unexpected error occurred during Google sign in.",
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
    } catch (error: any) {
      console.error('Email sign up exception:', error);
      // Don't show toast here, let the calling component handle it
      return { error };
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      // Prevent multiple sign-in attempts in progress
      if (signInInProgressRef.current) {
        console.log("Sign in already in progress, ignoring duplicate request");
        return { error: { message: "Sign in already in progress" } };
      }
      
      signInInProgressRef.current = true;
      console.log("Attempting to sign in with email:", email);
      
      // Clear any cached confirmation status for this user
      clearEmailConfirmationCache(email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Email sign in error:', error);
        signInInProgressRef.current = false;
        
        // Enhanced error reporting
        if (error.message?.includes("Invalid login credentials")) {
          return { 
            error: { 
              ...error, 
              message: "Invalid email or password. Please check your credentials and try again."
            } 
          };
        }
        
        return { error };
      }

      console.log("Sign in successful:", data);

      // Check if email is confirmed using a direct user fetch
      const { data: userData } = await supabase.auth.getUser();
      const isConfirmed = userData?.user?.email_confirmed_at !== null;
      
      // Update the cache
      if (email && userData?.user) {
        emailConfirmationCache.current[email.toLowerCase()] = isConfirmed;
      }
      
      if (!isConfirmed) {
        console.log("Email not confirmed, signing out user");
        toast({
          title: "Email Not Confirmed",
          description: "Please check your email and confirm your account before signing in.",
          variant: "destructive", 
          duration: 6000,
        });
        
        // Sign out the user if their email isn't confirmed
        await supabase.auth.signOut();
        signInInProgressRef.current = false;
        return { error: { message: "Email not confirmed" } };
      }

      // Success path - Let the component handle the navigation
      // We'll reset the sign-in flag after a delay to allow navigation to complete
      setTimeout(() => {
        signInInProgressRef.current = false;
      }, 2000);
      
      return { data };
      
    } catch (error: any) {
      console.error('Email sign in exception:', error);
      signInInProgressRef.current = false;
      
      // Better error handling for specific cases
      let enhancedError = error;
      if (error.message) {
        if (error.message.includes("network") || error.message.includes("fetch")) {
          enhancedError = { 
            ...error, 
            message: "Server connection issue. Please try again in a moment."
          };
        } else if (error.message.includes("auth/too-many-requests")) {
          enhancedError = { 
            ...error, 
            message: "Too many login attempts. Please try again later."
          };
        }
      }
      
      return { error: enhancedError };
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
    handleSignInWithGoogle,
    handleEmailSignUp,
    handleEmailSignIn,
    resendConfirmationEmail,
    isEmailConfirmed,
    checkEmailConfirmation,
    clearEmailConfirmationCache,
  };
};
