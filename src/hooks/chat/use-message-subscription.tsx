import { useEffect, useRef } from "react";
import { ChatMessage } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { INITIAL_MESSAGE } from "@/hooks/chat-sessions/use-session-creation";

const isDev = true; // Always log for debugging

export const useMessageSubscription = (
  sessionId: string | null,
  messages: ChatMessage[],
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setIsProcessing: (processing: boolean) => void
) => {
  // TEMPORARILY DISABLED - Just log that we're not using subscription
  useEffect(() => {
    if (sessionId) {
      console.log('🔇 Message subscription DISABLED for simplicity - using polling only');
    }
  }, [sessionId]);
};