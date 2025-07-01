
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatSession } from "@/types/chat";
import { SessionWithFeedback } from "@/types/chat";
import ChatSidebarHeader from "./ChatSidebarHeader";
import ChatSidebarLoader from "./ChatSidebarLoader";
import ChatSidebarContent from "./ChatSidebarContent";

const isDev = process.env.NODE_ENV !== 'production';

interface ChatSidebarProps {
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  setChatSessions: (sessions: ChatSession[]) => void;
  setCurrentSessionId: (id: string | null) => void;
  onNewChat: () => void;
  isLoading?: boolean;
  animationState?: {
    shouldAnimate: boolean;
    sessionId?: string;
  };
}

const ChatSidebar = ({
  chatSessions,
  currentSessionId,
  setChatSessions,
  setCurrentSessionId,
  onNewChat,
  isLoading = false,
  animationState,
}: ChatSidebarProps) => {
  const [sessionsWithFeedback, setSessionsWithFeedback] = useState<SessionWithFeedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);

  // Check feedback status and finishable status for all sessions
  const checkSessionStatus = async (sessions: ChatSession[]) => {
    if (sessions.length === 0) {
      setSessionsWithFeedback([]);
      setFeedbackLoading(false);
      return;
    }

    try {
      const sessionsWithStatus = await Promise.all(
        sessions.map(async (session) => {
          let hasUserFeedback = false;
          let isFinishable = false;
          
          if (session.finished) {
            // Check if feedback exists for finished sessions
            const { data: feedback } = await supabase
              .from('feedback')
              .select('id')
              .eq('session_id', session.id)
              .maybeSingle();
            
            hasUserFeedback = !!feedback;
            isFinishable = !hasUserFeedback;
          } else {
            // For non-finished sessions, check if they have assistant messages
            const { data: messages, count } = await supabase
              .from('chat_messages')
              .select('message_id', { count: 'exact' })
              .eq('session_id', session.id)
              .eq('role', 'assistant');
            
            isFinishable = false;
          }
          
          return { ...session, hasUserFeedback, isFinishable };
        })
      );
      
      setSessionsWithFeedback(sessionsWithStatus);
    } catch (error) {
      if (isDev) console.error('Error checking session status:', error);
      setSessionsWithFeedback(sessions.map(s => ({ ...s, hasUserFeedback: false, isFinishable: false })));
    } finally {
      setFeedbackLoading(false);
    }
  };

  useEffect(() => {
    checkSessionStatus(chatSessions);
  }, [chatSessions]);

  // Set up real-time subscription with reduced logging
  useEffect(() => {
    const channel = supabase
      .channel('session-updates-enhanced')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions'
        },
        async (payload) => {
          const updatedSession = payload.new as ChatSession;
          
          const updatedSessions = chatSessions.map(session => 
            session.id === updatedSession.id ? updatedSession : session
          );
          
          setChatSessions(updatedSessions);
          await checkSessionStatus(updatedSessions);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feedback'
        },
        async (payload) => {
          // When feedback is added, re-check session status
          await checkSessionStatus(chatSessions);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          // When new messages are added, re-check session status
          await checkSessionStatus(chatSessions);
        }
      )
      .subscribe((status) => {
        if (isDev && status !== 'SUBSCRIBED') {
          console.log('Sidebar subscription status:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatSessions, setChatSessions]);

  // Separate sessions into three categories
  const ongoingConsults = sessionsWithFeedback.filter(chat => 
    !chat.finished
  );
  const finishableConsults = sessionsWithFeedback.filter(chat => 
    chat.finished && !chat.hasUserFeedback
  );
  const completedConsults = sessionsWithFeedback.filter(chat => 
    chat.finished && chat.hasUserFeedback
  );

  if (isLoading || feedbackLoading) {
    return <ChatSidebarLoader onNewChat={onNewChat} />;
  }

  const updateSessionsAfterAction = (updatedSessions: SessionWithFeedback[]) => {
    setChatSessions(updatedSessions);
    setSessionsWithFeedback(updatedSessions);
  };

  return (
    <div className="h-full max-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-purple-50/30 dark:from-slate-900 dark:to-purple-950/30 overflow-hidden">
      <ChatSidebarHeader onNewChat={onNewChat} />
      
      <ChatSidebarContent
        ongoingConsults={ongoingConsults}
        finishableConsults={finishableConsults}
        completedConsults={completedConsults}
        currentSessionId={currentSessionId}
        onSessionsUpdate={updateSessionsAfterAction}
        onSessionSelect={setCurrentSessionId}
        animationState={animationState}
      />
    </div>
  );
};

export default ChatSidebar;
