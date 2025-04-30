
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAuthOperations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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

      // Check if user needs to confirm email
      const needsEmailConfirmation = !data.user?.email_confirmed_at;
      
      if (needsEmailConfirmation) {
        toast({
          title: "Sign Up Successful",
          description: "Please check your email to confirm your account before signing in.",
        });
      } else {
        toast({
          title: "Sign Up Successful",
          description: "You've been signed up successfully!",
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
      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Email Not Confirmed",
          description: "Please check your email and confirm your account before signing in.",
          variant: "destructive",
        });
        // Sign out the user immediately since they shouldn't be logged in yet
        await supabase.auth.signOut();
        return { error: new Error("Email not confirmed") };
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

  return {
    handleSignOut,
    handleSignInWithGithub,
    handleEmailSignUp,
    handleEmailSignIn,
  };
};
