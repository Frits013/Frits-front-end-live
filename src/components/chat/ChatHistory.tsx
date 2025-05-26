import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ChatHistoryItem from "./ChatHistoryItem";
import ChatHistoryEditItem from "./ChatHistoryEditItem";
import { SessionWithFeedback } from "@/types/chat";

interface ChatHistoryProps {
  chatHistories: SessionWithFeedback[];
  currentChatId: string | null;
  setChatHistories: (chats: SessionWithFeedback[]) => void;
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
    
    try {
      // First, check if there are any info_messages referencing the chat messages
      const { data: infoMessages, error: infoError } = await supabase
        .from('info_messages')
        .select('message_id')
        .filter('message_id', 'in', (query) => {
          query
            .select('message_id')
            .from('chat_messages')
            .eq('session_id', chatId);
        });

      if (infoError) {
        console.error('Error checking info messages:', infoError);
      } else if (infoMessages && infoMessages.length > 0) {
        // Delete associated info_messages first
        console.log('Deleting associated info messages');
        const { error: deleteInfoError } = await supabase
          .from('info_messages')
          .delete()
          .filter('message_id', 'in', infoMessages.map(m => m.message_id));
          
        if (deleteInfoError) {
          console.error('Error deleting info messages:', deleteInfoError);
          toast({
            title: "Error",
            description: "Failed to delete associated info messages",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Now delete the chat messages
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

      // Finally delete the session
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

  if (chatHistories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {chatHistories.map((chat) => (
        <div key={chat.id}>
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
              isCompleted={chat.finished && chat.hasUserFeedback}
              isFinishable={chat.isFinishable}
              onSelect={() => setCurrentChatId(chat.id)}
              onEdit={() => handleEditTitle(chat)}
              onDelete={handleDeleteChat}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ChatHistoryComponent;
