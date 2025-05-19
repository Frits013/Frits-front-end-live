
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChatSession } from "@/types/chat";

export const useSessionManagement = (
  setChatSessions: (sessions: ChatSession[]) => void
) => {
  const { toast } = useToast();

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    // Update the title in the chat_sessions table
    const { error } = await supabase
      .from('chat_sessions')
      .update({ session_name: newTitle })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session title:', error);
      toast({
        title: "Error",
        description: "Failed to update session title",
        variant: "destructive",
      });
      return false;
    }

    // Update the title in local state
    setChatSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === sessionId 
          ? { ...session, session_name: newTitle } 
          : session
      )
    );
    return true;
  };

  const markConsultFinished = async (sessionId: string) => {
    // Update the finished flag in the chat_sessions table
    const { error } = await supabase
      .from('chat_sessions')
      .update({ finished: true })
      .eq('id', sessionId);

    if (error) {
      console.error('Error marking consult as finished:', error);
      toast({
        title: "Error",
        description: "Failed to mark consult as finished",
        variant: "destructive",
      });
      return false;
    }

    // Update the finished flag in local state
    setChatSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === sessionId 
          ? { ...session, finished: true } 
          : session
      )
    );
    
    return true;
  };

  return {
    updateSessionTitle,
    markConsultFinished
  };
};
