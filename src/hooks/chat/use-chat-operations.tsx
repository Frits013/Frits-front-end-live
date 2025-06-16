import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SessionWithFeedback } from "@/types/chat";

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
    console.log('Updating chat title:', { chatId, newTitle });
    
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
    
    try {
      // First, delete all info_messages that reference messages in this session
      // We need to do this in a way that handles the foreign key constraints properly
      console.log('Deleting info messages for session:', chatId);
      const { error: deleteInfoError } = await supabase
        .from('info_messages')
        .delete()
        .in('message_id', 
          supabase
            .from('chat_messages')
            .select('message_id')
            .eq('session_id', chatId)
        );
        
      if (deleteInfoError) {
        console.error('Error deleting info messages:', deleteInfoError);
        // Try alternative approach - get message IDs first, then delete info messages
        const { data: chatMessages } = await supabase
          .from('chat_messages')
          .select('message_id')
          .eq('session_id', chatId);
          
        if (chatMessages && chatMessages.length > 0) {
          const messageIds = chatMessages.map(m => m.message_id);
          const { error: altDeleteInfoError } = await supabase
            .from('info_messages')
            .delete()
            .in('message_id', messageIds);
            
          if (altDeleteInfoError) {
            console.error('Alternative info message deletion failed:', altDeleteInfoError);
            toast({
              title: "Error",
              description: "Failed to delete associated info messages",
              variant: "destructive",
            });
            return;
          }
        }
      }
      
      // Delete chat messages
      console.log('Deleting chat messages');
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', chatId);
        
      if (messagesError) {
        console.error('Error deleting chat messages:', messagesError);
        toast({
          title: "Error",
          description: "Failed to delete chat messages",
          variant: "destructive",
        });
        return;
      }

      // Delete the session
      console.log('Deleting chat session');
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', chatId);

      if (sessionError) {
        console.error('Error deleting chat session:', sessionError);
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
    } catch (error) {
      console.error('Unexpected error during deletion:', error);
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
