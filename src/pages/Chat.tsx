import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ChatHistory from "@/components/chat/ChatHistory";
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
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  created_at: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const loadChatMessages = async (chatId: string) => {
    const { data: chatMessages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
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
      sender: msg.sender as 'user' | 'agent',
      timestamp: new Date(msg.created_at),
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
      
      // Fetch chat histories
      const { data: chats, error } = await supabase
        .from('chats')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching chats:', error);
        return;
      }

      setChatHistories(chats);

      // Create a new chat if none exists
      if (!currentChatId) {
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert([{
            user_id: session.user.id,
            title: 'New Chat'
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating chat:', createError);
          return;
        }

        setCurrentChatId(newChat.id);
      }
    };

    checkAuth();
  }, [navigate, currentChatId]);

  // Load messages when chat is selected
  useEffect(() => {
    if (currentChatId) {
      loadChatMessages(currentChatId);
    }
  }, [currentChatId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const updateChatTitle = async (chatId: string, newTitle: string) => {
    const { error } = await supabase
      .from('chats')
      .update({ title: newTitle })
      .eq('id', chatId);

    if (error) {
      console.error('Error updating chat title:', error);
      toast({
        title: "Error",
        description: "Failed to update chat title",
        variant: "destructive",
      });
      return false;
    }

    // Refresh chat histories to show the new title
    const { data: updatedChats } = await supabase
      .from('chats')
      .select('*')
      .order('created_at', { ascending: false });
    if (updatedChats) {
      setChatHistories(updatedChats);
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
                <ChatHistory
                  chatHistories={chatHistories}
                  currentChatId={currentChatId}
                  setChatHistories={setChatHistories}
                  setCurrentChatId={setCurrentChatId}
                />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <ChatContainer
          messages={messages}
          setMessages={setMessages}
          currentChatId={currentChatId}
          updateChatTitle={updateChatTitle}
        />
      </div>
    </SidebarProvider>
  );
};

export default Chat;