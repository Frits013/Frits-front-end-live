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
      console.log('Step 1: Fetching message IDs for session:', chatId);
      const { data: messageIds, error: fetchError } = await supabase
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
      
      const messageIdArray = messageIds?.map(m => m.message_id) || [];
      console.log('Found message IDs:', messageIdArray);

      // Step 2: Delete ALL info_messages for these message IDs
      if (messageIdArray.length > 0) {
        console.log('Step 2: Deleting info_messages for message IDs:', messageIdArray);
        const { error: deleteInfoError } = await supabase
          .from('info_messages')
          .delete()
          .in('message_id', messageIdArray);
            
        if (deleteInfoError) {
          console.error('Error deleting info messages:', deleteInfoError);
          toast({
            title: "Error",
            description: `Failed to delete info messages: ${deleteInfoError.message}`,
            variant: "destructive",
          });
          return;
        }
        
        console.log('Successfully deleted info messages');

        // Step 3: Verify no info_messages remain for these message IDs
        console.log('Step 3: Verifying info_messages deletion');
        const { data: remainingInfoMessages, error: verifyError } = await supabase
          .from('info_messages')
          .select('info_id, message_id')
          .in('message_id', messageIdArray);

        if (verifyError) {
          console.error('Error verifying info_messages deletion:', verifyError);
        } else if (remainingInfoMessages && remainingInfoMessages.length > 0) {
          console.error('Still have remaining info_messages:', remainingInfoMessages);
          toast({
            title: "Error",
            description: `Failed to completely delete info messages. ${remainingInfoMessages.length} records remain.`,
            variant: "destructive",
          });
          return;
        }

        console.log('Verification passed: No info_messages remain');
      } else {
        console.log('No message IDs found, skipping info_messages deletion');
      }

      // Step 4: Now delete chat messages
      console.log('Step 4: Deleting chat messages for session:', chatId);
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

      // Step 5: Finally delete the session
      console.log('Step 5: Deleting chat session:', chatId);
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
