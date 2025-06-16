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

      // Step 2: Delete ALL info_messages that could be related to this session
      // This includes both message_id references AND any other potential references
      console.log('Deleting all info messages for session:', chatId);
      
      if (chatMessages && chatMessages.length > 0) {
        const messageIds = chatMessages.map(m => m.message_id);
        console.log('Deleting info messages for message IDs:', messageIds);
        
        // Delete info_messages by message_id
        const { error: deleteInfoError } = await supabase
          .from('info_messages')
          .delete()
          .in('message_id', messageIds);
          
        if (deleteInfoError) {
          console.error('Error deleting info messages by message_id:', deleteInfoError);
          // Don't return here - try to continue with other deletion methods
        } else {
          console.log('Successfully deleted info messages by message_id');
        }
      }

      // Step 3: Delete any remaining info_messages that might reference this session indirectly
      // Get the user_id from the session first
      const { data: sessionData } = await supabase
        .from('chat_sessions')
        .select('user_id')
        .eq('id', chatId)
        .single();

      if (sessionData) {
        console.log('Deleting remaining info messages for user and timeframe');
        // Delete info_messages for this user that were created around the same time as the session
        const { error: deleteRemainingInfoError } = await supabase
          .from('info_messages')
          .delete()
          .eq('user_id', sessionData.user_id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

        if (deleteRemainingInfoError) {
          console.error('Error deleting remaining info messages:', deleteRemainingInfoError);
          // Continue anyway - this is a fallback
        }
      }
      
      // Step 4: Delete chat messages (should work now)
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

      // Step 5: Delete the session
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
