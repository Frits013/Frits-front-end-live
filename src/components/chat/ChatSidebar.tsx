import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import ChatHistoryComponent from "./ChatHistory";
import { ChatSession } from "@/types/chat";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import { SessionWithFeedback } from "@/types/chat";

interface ChatSidebarProps {
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  setChatSessions: (sessions: ChatSession[]) => void;
  setCurrentSessionId: (id: string | null) => void;
  onNewChat: () => void;
  isLoading?: boolean;
}

const ChatSidebar = ({
  chatSessions,
  currentSessionId,
  setChatSessions,
  setCurrentSessionId,
  onNewChat,
  isLoading = false,
}: ChatSidebarProps) => {
  const [sessionsWithFeedback, setSessionsWithFeedback] = useState<SessionWithFeedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);

  // Check feedback status and finishable status for all sessions
  useEffect(() => {
    const checkSessionStatus = async () => {
      if (chatSessions.length === 0) {
        setSessionsWithFeedback([]);
        setFeedbackLoading(false);
        return;
      }

      try {
        const sessionsWithStatus = await Promise.all(
          chatSessions.map(async (session) => {
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
            } else {
              // For non-finished sessions, check if they have messages to determine if finishable
              const { data: messages } = await supabase
                .from('chat_messages')
                .select('message_id')
                .eq('session_id', session.id)
                .limit(1);
              
              // A session is finishable if it has messages but isn't finished yet
              isFinishable = !!(messages && messages.length > 0);
            }
            
            return { ...session, hasUserFeedback, isFinishable };
          })
        );
        
        setSessionsWithFeedback(sessionsWithStatus);
      } catch (error) {
        console.error('Error checking session status:', error);
        setSessionsWithFeedback(chatSessions.map(s => ({ ...s, hasUserFeedback: false, isFinishable: false })));
      } finally {
        setFeedbackLoading(false);
      }
    };

    checkSessionStatus();
  }, [chatSessions]);

  // Separate sessions into three categories
  const readyConsults = sessionsWithFeedback.filter(chat => 
    !chat.finished && !chat.isFinishable
  );
  const finishableConsults = sessionsWithFeedback.filter(chat => 
    !chat.finished && chat.isFinishable
  );
  const completedConsults = sessionsWithFeedback.filter(chat => 
    chat.finished && chat.hasUserFeedback
  );

  if (isLoading || feedbackLoading) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-purple-50/30 dark:from-slate-900 dark:to-purple-950/30">
        <SidebarHeader className="p-6 border-b border-purple-100/50 dark:border-purple-800/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Frits AI</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your AI Consultant</p>
            </div>
          </div>
          <Button
            onClick={onNewChat}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 border-0"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start New Consult
          </Button>
        </SidebarHeader>
        
        <SidebarContent className="flex-1 overflow-auto px-3 py-4">
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="sm" text="Loading sessions..." />
          </div>
        </SidebarContent>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-purple-50/30 dark:from-slate-900 dark:to-purple-950/30">
      <SidebarHeader className="p-6 border-b border-purple-100/50 dark:border-purple-800/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Frits AI</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Your AI Consultant</p>
          </div>
        </div>
        <Button
          onClick={onNewChat}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 border-0"
          size="lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Start New Consult
        </Button>
      </SidebarHeader>
      
      <SidebarContent className="flex-1 overflow-auto px-3 py-4">
        <div className="space-y-6">
          {/* Ready consults section */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 mb-3 text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
              Ready Consults
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {readyConsults.length > 0 ? (
                <div className="space-y-2">
                  <ChatHistoryComponent
                    chatHistories={readyConsults}
                    currentChatId={currentSessionId}
                    setChatHistories={setChatSessions}
                    setCurrentChatId={setCurrentSessionId}
                  />
                </div>
              ) : (
                <div className="px-3 py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No ready consults
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Start a new consultation above
                  </p>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Finishable consults section */}
          {finishableConsults.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 mb-3 text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                Finishable Consults
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-2">
                  <ChatHistoryComponent
                    chatHistories={finishableConsults}
                    currentChatId={currentSessionId}
                    setChatHistories={setChatSessions}
                    setCurrentChatId={setCurrentSessionId}
                  />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Completed consults section */}
          {completedConsults.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 mb-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Completed Consults
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-2">
                  <ChatHistoryComponent
                    chatHistories={completedConsults}
                    currentChatId={currentSessionId}
                    setChatHistories={setChatSessions}
                    setCurrentChatId={setCurrentSessionId}
                  />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </div>
      </SidebarContent>
    </div>
  );
};

export default ChatSidebar;
