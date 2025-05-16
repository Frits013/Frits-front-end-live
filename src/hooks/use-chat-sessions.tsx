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
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
        finished: false // Always start as not finished
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
    
    // Send an automatic "hey" message to initiate the conversation
    // This will be invisible to the user
    await sendAutomaticHeyMessage(newSession.id, session.user.id);
    
    toast({
      title: "Success",
      description: "New consult session created",
    });
  };

  // Function to send an automatic "hey" message
  const sendAutomaticHeyMessage = async (sessionId: string, userId: string) => {
    try {
      // Generate a message_id
      const message_id = crypto.randomUUID();

      // Save the invisible "hey" message to the database
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          message_id,
          content: "hey",
          role: 'user',
          user_id: userId,
          session_id: sessionId,
        });

      if (error) {
        console.error('Error sending automatic message:', error);
        return;
      }

      // Get the access token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Call the edge function with the JWT token to process the message
      await supabase.functions.invoke('chat', {
        body: {
          session_id: sessionId,
          message_id,
          message: "hey", // The content of our automatic message
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    } catch (error) {
      console.error('Error in sendAutomaticHeyMessage:', error);
    }
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
    setIsLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsLoading(false);
      navigate('/');
      return;
    }
    
    console.log("Loading chat sessions for user:", session.user.id);
    
    try {
      // Query sessions from the chat_sessions table
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        setIsLoading(false);
        return;
      }

      console.log("Retrieved sessions:", sessions?.length || 0);
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
        console.log("Setting current session ID:", ongoingSession ? ongoingSession.id : sessions[0].id);
      }
    } catch (error) {
      console.error('Error in loadSessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load of sessions
  useEffect(() => {
    loadSessions();
    
    // Now listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
  }, []);

  return {
    chatSessions,
    setChatSessions,
    currentSessionId,
    setCurrentSessionId,
    createNewChat,
    updateSessionTitle,
    markConsultFinished,
    isLoading,
  };
};
