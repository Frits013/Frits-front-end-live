import { useEffect, useState } from "react";
import { ChatMessage, ChatSession, InterviewPhase, InterviewProgress } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";

const isDev = process.env.NODE_ENV !== 'production';

interface DemoPhaseManagementProps {
  sessionId: string | null;
  messages: ChatMessage[];
  sessionData: ChatSession | null;
  currentProgress: InterviewProgress | null;
}

export const useDemoPhaseManagement = ({
  sessionId,
  messages,
  sessionData,
  currentProgress
}: DemoPhaseManagementProps) => {
  const [localPhaseData, setLocalPhaseData] = useState<{
    phase: InterviewPhase;
    questionCount: number;
    lastBackendPhase: InterviewPhase | null;
    phaseStartMessageCount: number; // Track messages at phase start
  } | null>(null);

  // Initialize local phase data when session starts
  useEffect(() => {
    if (sessionData && !localPhaseData) {
      const userMessages = messages.filter(msg => msg.role === 'user');
      setLocalPhaseData({
        phase: sessionData.current_phase || 'introduction',
        questionCount: 0,
        lastBackendPhase: sessionData.current_phase || null,
        phaseStartMessageCount: userMessages.length
      });
    }
  }, [sessionData, localPhaseData, messages]);

  // Track backend phase changes and update local data
  useEffect(() => {
    if (sessionData?.current_phase && localPhaseData) {
      // If backend phase changed, update our local tracking
      if (sessionData.current_phase !== localPhaseData.lastBackendPhase) {
        if (isDev) console.log('Backend phase changed to:', sessionData.current_phase);
        
        const userMessages = messages.filter(msg => msg.role === 'user');
        setLocalPhaseData(prev => ({
          ...prev!,
          phase: sessionData.current_phase!,
          lastBackendPhase: sessionData.current_phase!,
          questionCount: 0, // Reset question count when phase changes
          phaseStartMessageCount: userMessages.length // Track where this phase started
        }));
      }
    }
  }, [sessionData?.current_phase, localPhaseData]);

  // Count questions and manage phase transitions for demo
  useEffect(() => {
    if (!localPhaseData || !sessionId) return;

    // Count user responses since the current phase started
    const userResponses = messages.filter(msg => msg.role === 'user');
    const currentPhaseQuestionCount = userResponses.length - localPhaseData.phaseStartMessageCount;
    
    // Update question count if it changed
    if (currentPhaseQuestionCount !== localPhaseData.questionCount) {
      setLocalPhaseData(prev => ({
        ...prev!,
        questionCount: currentPhaseQuestionCount
      }));

      // Demo logic: Auto-advance introduction phase after 3 questions
      if (localPhaseData.phase === 'introduction' && currentPhaseQuestionCount >= 3) {
        // Only advance if backend hasn't already moved us forward
        if (sessionData?.current_phase === 'introduction' || !sessionData?.current_phase) {
          if (isDev) console.log('Demo: Auto-advancing from introduction to theme_selection after 3 questions');
          
          // Update the session phase in the database
          updateSessionPhase('theme_selection');
        }
      }
    }
  }, [messages, localPhaseData, sessionId, sessionData?.current_phase]);

  const updateSessionPhase = async (newPhase: InterviewPhase) => {
    if (!sessionId) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          current_phase: newPhase,
          phase_metadata: {
            ...sessionData?.phase_metadata,
            demo_transition: true,
            transition_reason: `Auto-advanced after ${localPhaseData?.questionCount} questions`
          }
        })
        .eq('id', sessionId);

      if (error) {
        if (isDev) console.error('Error updating session phase:', error);
      } else {
        if (isDev) console.log(`Successfully updated session phase to: ${newPhase}`);
      }
    } catch (error) {
      if (isDev) console.error('Failed to update session phase:', error);
    }
  };

  return {
    currentPhase: (localPhaseData?.phase || sessionData?.current_phase || 'introduction') as InterviewPhase,
    questionCount: localPhaseData?.questionCount || 0,
    maxQuestions: localPhaseData?.phase === 'introduction' ? 3 : 
                  localPhaseData?.phase === 'theme_selection' ? 3 :
                  localPhaseData?.phase === 'deep_dive' ? 8 :
                  localPhaseData?.phase === 'summary' ? 2 : 3
  };
};