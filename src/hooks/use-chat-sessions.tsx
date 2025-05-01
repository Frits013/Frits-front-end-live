import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChatSession } from "@/types/chat";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export const useChatSessions = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const createNewChat = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to create a new consult session",
        variant: "destructive",
      });
      return;
    }

    // Format current date and time in a readable format
    const formattedDateTime = format(new Date(), "MMM d, yyyy h:mm a");

    // Create a new session in the chat_sessions table
    const { data: newSession, error } = await supabase
      .from('chat_sessions')
      .insert([{
        user_id: session.user.id,
        session_name: `Consult Session - ${formattedDateTime}`,
        finished: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating new chat session:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat session",
        variant: "destructive",
      });
      return;
    }

    // Add a system message to identify the new chat session
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert([{
        content: "", // Empty initial message
        role: 'system',
        user_id: session.user.id,
        session_id: newSession.id,
      }]);

    if (messageError) {
      console.error('Error creating initial message:', messageError);
    }

    setCurrentSessionId(newSession.id);
    setChatSessions([newSession, ...chatSessions]);
    
    toast({
      title: "Success",
      description: "New consult session created",
    });
  };

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
    // This will now be called only after feedback is submitted and "End Session" button is clicked
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

  const loadSessions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/');
      return;
    }
    
    try {
      // Query sessions from the chat_sessions table
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      setChatSessions(sessions || []);

      if (sessions && sessions.length === 0) {
        console.log('No existing sessions, creating new one...');
        await createNewChat();
      } else if (sessions && sessions.length > 0 && !currentSessionId) {
        // Find the most recent ongoing session first
        const ongoingSession = sessions.find(s => !s.finished);
        
        // If there's an ongoing session, set it as current
        // Otherwise, fall back to the most recent session (which would be completed)
        setCurrentSessionId(ongoingSession ? ongoingSession.id : sessions[0].id);
      }
    } catch (error) {
      console.error('Error in loadSessions:', error);
    }
  };

  useEffect(() => {
    loadSessions();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        loadSessions();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return {
    chatSessions,
    setChatSessions,
    currentSessionId,
    setCurrentSessionId,
    createNewChat,
    updateSessionTitle,
    markConsultFinished,
  };
};
