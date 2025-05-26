
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSessionValidation = () => {
  const { toast } = useToast();

  const validateSession = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      toast({
        title: "Error",
        description: "Session error: " + sessionError.message,
        variant: "destructive",
      });
      return null;
    }
  
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to send messages",
        variant: "destructive",
      });
      return null;
    }

    return session;
  };

  return { validateSession };
};
