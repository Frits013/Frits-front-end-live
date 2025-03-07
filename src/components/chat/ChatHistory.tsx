
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import ChatHistoryItem from "./ChatHistoryItem";
import ChatHistoryEditItem from "./ChatHistoryEditItem";
import { ChatSession } from "@/types/chat";

interface ChatHistoryProps {
  chatHistories: ChatSession[];
  currentChatId: string | null;
  setChatHistories: (chats: ChatSession[]) => void;
  setCurrentChatId: (id: string | null) => void;
}

const ChatHistoryComponent = ({
  chatHistories,
  currentChatId,
  setChatHistories,
  setCurrentChatId,
}: ChatHistoryProps) => {
  const { toast } = useToast();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const updateChatTitle = async (chatId: string, newTitle: string) => {
    console.log('Updating chat title:', { chatId, newTitle });
    
    // Update the title in the database
    const { error } = await supabase
      .from('chat_sessions')
      .update({ session_name: newTitle.trim() })
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
    
    return true;
  };

  const handleDeleteChat = async (chatId: string) => {
    console.log('Attempting to delete chat:', chatId);
    
    // Delete the session (cascade will delete messages)
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', chatId);

    if (error) {
      console.error('Error deleting chat session:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive",
      });
      return;
    }

    console.log('Successfully deleted chat session');
    setChatHistories(chatHistories.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }

    toast({
      title: "Success",
      description: "Chat deleted successfully",
    });
  };

  const handleEditTitle = (chat: ChatSession) => {
    setEditingChatId(chat.id);
    setEditingTitle(chat.session_name);
  };

  const handleSaveTitle = async (chatId: string) => {
    if (editingTitle.trim()) {
      const success = await updateChatTitle(chatId, editingTitle.trim());
      if (success) {
        setChatHistories(chatHistories.map(chat =>
          chat.id === chatId ? { ...chat, session_name: editingTitle.trim() } : chat
        ));
      }
    }
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  return (
    <SidebarMenu>
      {chatHistories.map((chat) => (
        <SidebarMenuItem key={chat.id}>
          {editingChatId === chat.id ? (
            <ChatHistoryEditItem
              editingTitle={editingTitle}
              onTitleChange={setEditingTitle}
              onSave={() => handleSaveTitle(chat.id)}
              onCancel={handleCancelEdit}
            />
          ) : (
            <ChatHistoryItem
              id={chat.id}
              title={chat.session_name}
              isActive={currentChatId === chat.id}
              onSelect={() => setCurrentChatId(chat.id)}
              onEdit={() => handleEditTitle(chat)}
              onDelete={handleDeleteChat}
            />
          )}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
};

export default ChatHistoryComponent;
