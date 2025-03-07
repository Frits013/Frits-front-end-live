
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChatSession } from "@/types/chat";
import { useNavigate } from "react-router-dom";

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

    const { count } = await supabase
      .from('chat_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id);

    const sessionNumber = (count || 0) + 1;

    const { data: newSession, error } = await supabase
      .from('chat_sessions')
      .insert([{
        title: `Consult Session ${sessionNumber}`,
        user_id: session.user.id,
        role: 'assistant', // Default role for new sessions
        content: null // Will be populated when internal conversation occurs
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating new consult session:', error);
      toast({
        title: "Error",
        description: "Failed to create new consult session",
        variant: "destructive",
      });
      return;
    }

    setCurrentSessionId(newSession.id);
    setChatSessions([newSession, ...chatSessions]);
    toast({
      title: "Success",
      description: "New consult session created",
    });
  };

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title: newTitle })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session title:', error);
      toast({
        title: "Error",
        description: "Failed to update chat title",
        variant: "destructive",
      });
      return false;
    }

    const { data: updatedSessions } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    if (updatedSessions) {
      setChatSessions(updatedSessions);
    }
    return true;
  };

  const loadSessions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/');
      return;
    }
    
    try {
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      setChatSessions(sessions || []);

      if (sessions?.length === 0) {
        console.log('No existing sessions, creating new one...');
        await createNewChat();
      } else if (sessions && sessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(sessions[0].id);
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
  };
};
