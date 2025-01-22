import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ChatHistoryComponent from "@/components/chat/ChatHistory";
import ChatContainer from "@/components/chat/ChatContainer";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarProvider,
} from "@/components/ui/sidebar";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: Date;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
      content: msg.content,
      role: msg.role as 'user' | 'assistant',
      created_at: new Date(msg.created_at),
    }));

    setMessages(formattedMessages);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }
      
      // Fetch chat sessions
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      setChatSessions(sessions);

      // Create a new session if none exists
      if (!currentSessionId && (!sessions || sessions.length === 0)) {
        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert([{
            title: 'New Chat'
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating session:', createError);
          return;
        }

        setCurrentSessionId(newSession.id);
      }
    };

    checkAuth();
  }, [navigate, currentSessionId]);

  // Load messages when session is selected
  useEffect(() => {
    if (currentSessionId) {
      loadChatMessages(currentSessionId);
    }
  }, [currentSessionId]);

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

    // Refresh chat sessions to show the new title
    const { data: updatedSessions } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    if (updatedSessions) {
      setChatSessions(updatedSessions);
    }
    return true;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-purple-50/30 via-blue-50/30 to-purple-50/30">
        <Sidebar>
          <SidebarHeader className="p-4">
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Chat History</SidebarGroupLabel>
              <SidebarGroupContent>
                <ChatHistoryComponent
                  chatHistories={chatSessions}
                  currentChatId={currentSessionId}
                  setChatHistories={setChatSessions}
                  setCurrentChatId={setCurrentSessionId}
                />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <ChatContainer
          messages={messages}
          setMessages={setMessages}
          currentChatId={currentSessionId}
          updateChatTitle={updateSessionTitle}
        />
      </div>
    </SidebarProvider>
  );
};

export default Chat;