import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@/types/chat";
import ChatLayout from "@/components/chat/ChatLayout";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatContainer from "@/components/chat/ChatContainer";
import ChatHeader from "@/components/chat/ChatHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider } from "@/components/ui/sidebar";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const loadChatMessages = async (sessionId: string) => {
    console.log('Loading messages for session:', sessionId);
    const { data: chatMessages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading chat messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
      return;
    }

    const formattedMessages: Message[] = chatMessages.map(msg => ({
      id: msg.id,
      message: msg.message,
      role: msg.role as 'user' | 'assistant',
      created_at: new Date(msg.created_at),
    }));

    setMessages(formattedMessages);
  };

  const createNewChat = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to create a new chat",
        variant: "destructive",
      });
      return;
    }

    const { data: newSession, error } = await supabase
      .from('chat_sessions')
      .insert([{
        title: 'New Chat',
        user_id: session.user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating new chat:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
      return;
    }

    setCurrentSessionId(newSession.id);
    setChatSessions([newSession, ...chatSessions]);
    setMessages([]);
    toast({
      title: "Success",
      description: "New chat created",
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
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

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }
      
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
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        checkAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (currentSessionId) {
      loadChatMessages(currentSessionId);
    }
  }, [currentSessionId]);

  return (
    <SidebarProvider>
      <ChatLayout
        sidebar={
          <ChatSidebar
            chatSessions={chatSessions}
            currentSessionId={currentSessionId}
            setChatSessions={setChatSessions}
            setCurrentSessionId={setCurrentSessionId}
            onNewChat={createNewChat}
            onSignOut={handleSignOut}
          />
        }
        content={
          <>
            {isMobile && (
              <ChatHeader
                onNewChat={createNewChat}
                onSignOut={handleSignOut}
              />
            )}
            <ChatContainer
              messages={messages}
              setMessages={setMessages}
              currentChatId={currentSessionId}
              updateChatTitle={updateSessionTitle}
            />
          </>
        }
      />
    </SidebarProvider>
  );
};

export default Chat;