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
      // Step 1: Get all message IDs for this session first
      console.log('Step 1: Fetching message IDs for session:', chatId);
      const { data: messages, error: fetchError } = await supabase
        .from('chat_messages')
        .select('message_id')
        .eq('session_id', chatId);
        
      if (fetchError) {
        console.error('Error fetching message IDs:', fetchError);
        toast({
          title: "Error",
          description: `Failed to fetch message IDs: ${fetchError.message}`,
          variant: "destructive",
        });
        return;
      }
      
      const messageIds = messages?.map(m => m.message_id) || [];
      console.log('Found message IDs:', messageIds);

      // Step 2: Delete all info_messages for these message IDs
      if (messageIds.length > 0) {
        console.log('Step 2: Deleting info_messages for message IDs:', messageIds);
        const { error: deleteInfoError } = await supabase
          .from('info_messages')
          .delete()
          .in('message_id', messageIds);
            
        if (deleteInfoError) {
          console.error('Error deleting info messages:', deleteInfoError);
          toast({
            title: "Error",
            description: `Failed to delete info messages: ${deleteInfoError.message}`,
            variant: "destructive",
          });
          return;
        }
        
        console.log('Successfully deleted all info messages for session');
      }

      // Step 3: Delete all chat messages for this session
      console.log('Step 3: Deleting chat messages for session:', chatId);
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', chatId);
        
      if (messagesError) {
        console.error('Error deleting chat messages:', messagesError);
        toast({
          title: "Error",
          description: `Failed to delete chat messages: ${messagesError.message}`,
          variant: "destructive",
        });
        return;
      }
      console.log('Successfully deleted chat messages');

      // Step 4: Delete the session
      console.log('Step 4: Deleting chat session:', chatId);
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
