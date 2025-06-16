
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
      // Step 1: Get all message IDs for this session
      console.log('Getting all message IDs for session:', chatId);
      const { data: chatMessages, error: messagesQueryError } = await supabase
        .from('chat_messages')
        .select('message_id')
        .eq('session_id', chatId);

      if (messagesQueryError) {
        console.error('Error querying chat messages:', messagesQueryError);
        toast({
          title: "Error",
          description: "Failed to query chat messages",
          variant: "destructive",
        });
        return;
      }

      console.log('Found chat messages:', chatMessages?.length || 0);

      // Step 2: Delete ALL info_messages that reference these message_ids
      if (chatMessages && chatMessages.length > 0) {
        const messageIds = chatMessages.map(m => m.message_id);
        console.log('Deleting info messages for message IDs:', messageIds);
        
        // First, let's see how many info_messages exist for these message_ids
        const { data: infoMessagesCount, error: countError } = await supabase
          .from('info_messages')
          .select('info_id', { count: 'exact' })
          .in('message_id', messageIds);
          
        console.log('Found info_messages to delete:', infoMessagesCount?.length || 0);
        
        // Delete ALL info_messages that reference any of these message_ids
        const { error: deleteInfoError } = await supabase
          .from('info_messages')
          .delete()
          .in('message_id', messageIds);
          
        if (deleteInfoError) {
          console.error('Error deleting info messages by message_id:', deleteInfoError);
          toast({
            title: "Error",
            description: `Failed to delete info messages: ${deleteInfoError.message}`,
            variant: "destructive",
          });
          return;
        }
        
        console.log('Successfully deleted info messages by message_id');
        
        // Verify deletion by checking if any info_messages still reference these message_ids
        const { data: remainingInfoMessages, error: verifyError } = await supabase
          .from('info_messages')
          .select('info_id')
          .in('message_id', messageIds);
          
        if (remainingInfoMessages && remainingInfoMessages.length > 0) {
          console.error('Still found remaining info_messages after deletion:', remainingInfoMessages.length);
          toast({
            title: "Error",
            description: "Failed to completely clean up info messages",
            variant: "destructive",
          });
          return;
        }
        
        console.log('Verified: All info_messages deleted successfully');
      }
      
      // Step 3: Delete chat messages (should work now)
      console.log('Deleting chat messages for session:', chatId);
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
      console.log('Deleting chat session:', chatId);
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
