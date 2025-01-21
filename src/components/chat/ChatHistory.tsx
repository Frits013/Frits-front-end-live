import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import ChatHistoryItem from "./ChatHistoryItem";
import ChatHistoryEditItem from "./ChatHistoryEditItem";

interface ChatHistory {
  id: string;
  title: string;
  created_at: string;
}

interface ChatHistoryProps {
  chatHistories: ChatHistory[];
  currentChatId: string | null;
  setChatHistories: (chats: ChatHistory[]) => void;
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
    return true;
  };

  const handleDeleteChat = async (chatId: string) => {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId);

    if (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
      return;
    }

    setChatHistories(chatHistories.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }

    toast({
      title: "Success",
      description: "Chat deleted successfully",
    });
  };

  const handleEditTitle = (chat: ChatHistory) => {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleSaveTitle = async (chatId: string) => {
    if (editingTitle.trim()) {
      const success = await updateChatTitle(chatId, editingTitle.trim());
      if (success) {
        setChatHistories(chatHistories.map(chat =>
          chat.id === chatId ? { ...chat, title: editingTitle.trim() } : chat
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
              title={chat.title}
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