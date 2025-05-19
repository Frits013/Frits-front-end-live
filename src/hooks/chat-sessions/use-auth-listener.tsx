
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatSession } from "@/types/chat";

interface UseAuthListenerProps {
  loadSessions: () => Promise<void>;
  setChatSessions: (sessions: ChatSession[]) => void;
  setCurrentSessionId: (id: string | null) => void;
}

export const useAuthListener = ({
  loadSessions,
  setChatSessions,
  setCurrentSessionId
}: UseAuthListenerProps) => {
  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log("Auth state changed:", event);
      
      if (event === 'SIGNED_IN') {
        console.log("User signed in, loading sessions");
        // Explicitly load sessions when the user signs in
        loadSessions();
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out, clearing sessions");
        setChatSessions([]);
        setCurrentSessionId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadSessions, setChatSessions, setCurrentSessionId]);
};
