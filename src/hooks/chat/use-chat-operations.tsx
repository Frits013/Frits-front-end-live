
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SessionWithFeedback } from "@/types/chat";

const isDev = process.env.NODE_ENV !== 'production';

export const useChatOperations = (
  chatHistories: SessionWithFeedback[],
  setChatHistories: (chats: SessionWithFeedback[]) => void,
  currentChatId: string | null,
  setCurrentChatId: (id: string | null) => void
) => {
  const { toast } = useToast();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const updateChatTitle = async (chatId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ session_name: newTitle.trim() })
        .eq('id', chatId);
      
      if (error) {
        if (isDev) console.error('Error updating chat title:', error);
        toast({
          title: "Error",
          description: "Failed to update chat title",
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    } catch (error) {
      if (isDev) console.error('Unexpected error updating chat title:', error);
      toast({
        title: "Error",
        description: "Failed to update chat title",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      // First, get all message IDs for this session
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('message_id')
        .eq('session_id', chatId);

      if (messagesError) {
        if (isDev) console.error('Error fetching messages:', messagesError);
        toast({
          title: "Error",
          description: "Failed to fetch chat messages",
          variant: "destructive",
        });
        return;
      }

      // Delete info messages that reference these message IDs
      if (messages && messages.length > 0) {
        const messageIds = messages.map(m => m.message_id);
        
        const { error: deleteInfoError } = await supabase
          .from('info_messages')
          .delete()
          .in('message_id', messageIds);
          
        if (deleteInfoError) {
          if (isDev) console.error('Error deleting info messages:', deleteInfoError);
          toast({
            title: "Error",
            description: "Failed to delete associated info messages",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Delete chat messages
      const { error: deleteChatMessagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', chatId);
        
      if (deleteChatMessagesError) {
        if (isDev) console.error('Error deleting chat messages:', deleteChatMessagesError);
        toast({
          title: "Error",
          description: "Failed to delete chat messages",
          variant: "destructive",
        });
        return;
      }

      // Delete the session
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', chatId);

      if (sessionError) {
        if (isDev) console.error('Error deleting chat session:', sessionError);
        toast({
          title: "Error",
          description: "Failed to delete chat session",
          variant: "destructive",
        });
        return;
      }

      // Update UI state
      setChatHistories(chatHistories.filter(chat => chat.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }

      toast({
        title: "Success",
        description: "Chat deleted successfully",
      });
    } catch (error) {
      if (isDev) console.error('Unexpected error during deletion:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleEditTitle = (chat: SessionWithFeedback) => {
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

  return {
    editingChatId,
    editingTitle,
    setEditingTitle,
    handleEditTitle,
    handleSaveTitle,
    handleCancelEdit,
    handleDeleteChat
  };
};
