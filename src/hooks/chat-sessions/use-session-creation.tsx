
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ChatSession } from "@/types/chat";

export const useSessionCreation = (
  chatSessions: ChatSession[],
  setChatSessions: (sessions: ChatSession[]) => void,
  setCurrentSessionId: (id: string | null) => void
) => {
  const { toast } = useToast();

  const createNewChat = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to create a new consult session",
        variant: "destructive",
      });
      return;
    }

    // Show the success toast immediately when user clicks
    toast({
      title: "Success",
      description: "New consult session created",
    });

    // Format current date and time in a readable format
    const formattedDateTime = format(new Date(), "MMM d, yyyy h:mm a");

    // Create a new session in the chat_sessions table
    const { data: newSession, error } = await supabase
      .from('chat_sessions')
      .insert([{
        user_id: session.user.id,
        session_name: `Consult Session - ${formattedDateTime}`,
        finished: false // Always start as not finished
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating new chat session:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat session",
        variant: "destructive",
      });
      return;
    }

    // Add a system message to identify the new chat session
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert([{
        content: "", // Empty initial message
        role: 'system',
        user_id: session.user.id,
        session_id: newSession.id,
      }]);

    if (messageError) {
      console.error('Error creating initial message:', messageError);
    }

    setCurrentSessionId(newSession.id);
    setChatSessions([newSession, ...chatSessions]);
    
    // Send an automatic "hey" message to initiate the conversation
    await sendAutomaticHeyMessage(newSession.id, session.user.id);
  };

  // Function to send an automatic "hey" message
  const sendAutomaticHeyMessage = async (sessionId: string, userId: string) => {
    try {
      // Generate a message_id
      const message_id = crypto.randomUUID();

      // Save the invisible "hey" message to the database
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          message_id,
          content: "hey",
          role: 'user',
          user_id: userId,
          session_id: sessionId,
        });

      if (error) {
        console.error('Error sending automatic message:', error);
        return;
      }

      // Get the access token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Call the edge function with the JWT token to process the message
      await supabase.functions.invoke('chat', {
        body: {
          session_id: sessionId,
          message_id,
          message: "hey", // The content of our automatic message
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    } catch (error) {
      console.error('Error in sendAutomaticHeyMessage:', error);
    }
  };

  return { createNewChat };
};
