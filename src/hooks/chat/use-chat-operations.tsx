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
      // Step 1: Delete ALL info_messages for this session directly by session_id if possible
      // or by finding all message_ids first and then deleting info_messages
      console.log('Step 1: Getting all message IDs for session:', chatId);
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

      // Step 2: Delete info_messages that reference these chat_messages
      if (chatMessages && chatMessages.length > 0) {
        const messageIds = chatMessages.map(m => m.message_id);
        console.log('Step 2: Deleting info messages for message IDs:', messageIds);
        
        // Delete ALL info_messages that have message_id in our list
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
        
        console.log('Successfully deleted info messages');
      }

      // Step 3: Try to delete any info_messages that might not have been caught above
      // This is a safety net in case there are orphaned info_messages
      console.log('Step 3: Cleaning up any remaining info_messages by user');
      const { data: sessionData } = await supabase
        .from('chat_sessions')
        .select('user_id, created_at')
        .eq('id', chatId)
        .single();

      if (sessionData) {
        // Delete any info_messages for this user created around the session time
        // This is aggressive but necessary to ensure clean deletion
        const sessionDate = new Date(sessionData.created_at);
        const startTime = new Date(sessionDate.getTime() - 60 * 60 * 1000); // 1 hour before
        const endTime = new Date(sessionDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours after
        
        const { error: cleanupError } = await supabase
          .from('info_messages')
          .delete()
          .eq('user_id', sessionData.user_id)
          .gte('created_at', startTime.toISOString())
          .lte('created_at', endTime.toISOString());
          
        if (cleanupError) {
          console.warn('Warning during info_messages cleanup:', cleanupError);
          // Don't return here - this is just a cleanup attempt
        } else {
          console.log('Completed info_messages cleanup');
        }
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
