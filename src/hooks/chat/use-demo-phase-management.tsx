import { useEffect, useState } from "react";
import { ChatMessage, ChatSession, InterviewPhase } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";

const isDev = process.env.NODE_ENV !== 'production';

interface DemoPhaseManagementProps {
  sessionId: string | null;
  messages: ChatMessage[];
  sessionData: ChatSession | null;
}

export const useDemoPhaseManagement = ({
  sessionId,
  messages,
  sessionData
}: DemoPhaseManagementProps) => {
  const [localPhaseData, setLocalPhaseData] = useState<{
    phase: InterviewPhase;
    questionCount: number;
    lastBackendPhase: InterviewPhase | null;
    phaseStartMessageCount: number; // Track messages at phase start
  } | null>(null);

  // Hardcoded phase limits - frontend controlled
  const getMaxQuestions = (phase: InterviewPhase): number => {
    const phaseConfig = {
      'introduction': 3,
      'theme_selection': 4,
      'deep_dive': 10,
      'summary': 1,
      'recommendations': 1
    };
    return phaseConfig[phase] || 3;
  };

  // Initialize local phase data when session starts
  useEffect(() => {
    if (sessionData && !localPhaseData) {
      // Count both assistant and writer messages (AI responses)
      const aiMessages = messages.filter(msg => msg.role === 'assistant' || msg.role === 'writer');
      if (isDev) console.log('🔧 Initializing phase data. AI messages found:', aiMessages.length);
      
      setLocalPhaseData({
        phase: sessionData.current_phase || 'introduction',
        questionCount: 0,
        lastBackendPhase: sessionData.current_phase || null,
        phaseStartMessageCount: aiMessages.length
      });
    }
  }, [sessionData, localPhaseData, messages]);

  // Track backend phase changes and update local data
  useEffect(() => {
    if (sessionData?.current_phase && localPhaseData) {
      // If backend phase changed, update our local tracking
      if (sessionData.current_phase !== localPhaseData.lastBackendPhase) {
        if (isDev) console.log('🔄 Backend phase changed to:', sessionData.current_phase);
        
        const aiMessages = messages.filter(msg => msg.role === 'assistant' || msg.role === 'writer');
        setLocalPhaseData(prev => ({
          ...prev!,
          phase: sessionData.current_phase!,
          lastBackendPhase: sessionData.current_phase!,
          questionCount: 0, // Reset question count when phase changes
          phaseStartMessageCount: aiMessages.length // Track where this phase started
        }));
      }
    }
  }, [sessionData?.current_phase, localPhaseData]);

  // Count questions and manage phase transitions
  useEffect(() => {
    if (!localPhaseData || !sessionId) return;

    // Count AI questions (both assistant and writer) since the current phase started
    const aiQuestions = messages.filter(msg => msg.role === 'assistant' || msg.role === 'writer');
    const currentPhaseQuestionCount = aiQuestions.length - localPhaseData.phaseStartMessageCount;
    
    if (isDev) console.log(`📊 Phase: ${localPhaseData.phase}, Questions: ${currentPhaseQuestionCount}/${getMaxQuestions(localPhaseData.phase)}`);
    
    // Update question count if it changed
    if (currentPhaseQuestionCount !== localPhaseData.questionCount) {
      setLocalPhaseData(prev => ({
        ...prev!,
        questionCount: currentPhaseQuestionCount
      }));

      const currentMaxQuestions = getMaxQuestions(localPhaseData.phase);

      // Auto-advance phases based on question limits
      if (currentPhaseQuestionCount >= currentMaxQuestions) {
        // Only advance if backend hasn't already moved us forward
        if (sessionData?.current_phase === localPhaseData.phase || !sessionData?.current_phase) {
          let nextPhase: InterviewPhase | null = null;
          
          switch (localPhaseData.phase) {
            case 'introduction':
              nextPhase = 'theme_selection';
              break;
            case 'theme_selection':
              nextPhase = 'deep_dive';
              break;
            case 'deep_dive':
              nextPhase = 'summary';
              break;
            // Summary and recommendations are handled differently (button/auto-complete)
          }

          if (nextPhase) {
            if (isDev) console.log(`🚀 Auto-advancing from ${localPhaseData.phase} to ${nextPhase} after ${currentPhaseQuestionCount} questions`);
            updateSessionPhase(nextPhase);
          }
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

  // Function to trigger next phase (used for summary -> recommendations button)
  const triggerNextPhase = () => {
    if (localPhaseData?.phase === 'summary') {
      updateSessionPhase('recommendations');
    }
  };

  const currentPhase = (localPhaseData?.phase || sessionData?.current_phase || 'introduction') as InterviewPhase;
  const maxQuestions = getMaxQuestions(currentPhase);

  return {
    currentPhase,
    questionCount: localPhaseData?.questionCount || 0,
    maxQuestions,
    triggerNextPhase,
    canTriggerNextPhase: localPhaseData?.phase === 'summary'
  };
};