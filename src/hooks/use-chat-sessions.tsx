
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

    // Group messages by session ID to create virtual "chat sessions"
    const { data: newMessage, error } = await supabase
      .from('chat_messages')
      .insert([{
        content: "", // Empty initial message
        role: 'system',
        user_id: session.user.id,
        session_id: crypto.randomUUID(), // Generate a new session ID
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

    // Create a virtual session from the message
    const newSession: ChatSession = {
      id: newMessage.session_id,
      title: `Consult Session ${Date.now()}`,
      created_at: newMessage.created_at,
    };

    setCurrentSessionId(newSession.id);
    setChatSessions([newSession, ...chatSessions]);
    
    toast({
      title: "Success",
      description: "New consult session created",
    });
  };

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    // Since we don't have a chat_sessions table, we'll update the title 
    // in our local state only
    setChatSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === sessionId 
          ? { ...session, title: newTitle } 
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
      // Query all distinct session_ids from chat_messages
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('session_id, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      // Create virtual sessions from the distinct session_ids
      const uniqueSessions = new Map<string, ChatSession>();
      
      messages?.forEach(message => {
        if (message.session_id && !uniqueSessions.has(message.session_id)) {
          uniqueSessions.set(message.session_id, {
            id: message.session_id,
            title: `Consult Session ${uniqueSessions.size + 1}`,
            created_at: message.created_at
          });
        }
      });

      const sessions = Array.from(uniqueSessions.values());
      setChatSessions(sessions || []);

      if (sessions.length === 0) {
        console.log('No existing sessions, creating new one...');
        await createNewChat();
      } else if (sessions.length > 0 && !currentSessionId) {
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
