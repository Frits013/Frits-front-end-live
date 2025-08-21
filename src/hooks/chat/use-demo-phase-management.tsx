import { useEffect, useState } from "react";
import { ChatMessage, ChatSession, InterviewPhase } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";

const isDev = process.env.NODE_ENV !== 'production';

interface DemoPhaseManagementProps {
  sessionId: string | null;
  messages: ChatMessage[];
  sessionData: ChatSession | null;
}

// Phase definitions with max questions per phase
const phaseDefinitions = {
  'introduction': { maxQuestions: 3, order: 0 },
  'theme_selection': { maxQuestions: 5, order: 1 },
  'deep_dive': { maxQuestions: 8, order: 2 },
  'summary': { maxQuestions: 3, order: 3 },
  'recommendations': { maxQuestions: 2, order: 4 }
};

export const useDemoPhaseManagement = ({
  sessionId,
  messages,
  sessionData
}: DemoPhaseManagementProps) => {
  const writerMessages = messages.filter(msg => msg.role === 'writer');
  const currentPhase = (sessionData?.current_phase || 'introduction') as InterviewPhase;
  
  // Calculate phase question counts from messages
  const calculatePhaseQuestionCounts = (messages: ChatMessage[]): Record<string, number> => {
    const phaseQuestionCounts: Record<string, number> = {};
    let currentPhaseTracker: InterviewPhase = 'introduction';
    let questionsInCurrentPhase = 0;
    
    // Track transitions through phases based on message count
    messages.forEach((_, index) => {
      questionsInCurrentPhase++;
      
      // Check if we should transition to next phase
      const currentPhaseDef = phaseDefinitions[currentPhaseTracker];
      if (questionsInCurrentPhase >= currentPhaseDef.maxQuestions) {
        phaseQuestionCounts[currentPhaseTracker] = currentPhaseDef.maxQuestions;
        
        // Move to next phase if available
        const phases = Object.keys(phaseDefinitions) as InterviewPhase[];
        const currentIndex = phases.findIndex(p => p === currentPhaseTracker);
        if (currentIndex < phases.length - 1) {
          currentPhaseTracker = phases[currentIndex + 1];
          questionsInCurrentPhase = 0;
        }
      }
    });
    
    // Set count for current phase
    if (questionsInCurrentPhase > 0) {
      phaseQuestionCounts[currentPhaseTracker] = questionsInCurrentPhase;
    }
    
    return phaseQuestionCounts;
  };

  // Determine correct phase based on completed phases
  const determineCorrectPhase = (phaseQuestionCounts: Record<string, number>): InterviewPhase => {
    const phases = Object.keys(phaseDefinitions) as InterviewPhase[];
    
    for (let i = phases.length - 1; i >= 0; i--) {
      const phase = phases[i];
      const questionsInPhase = phaseQuestionCounts[phase] || 0;
      
      if (questionsInPhase > 0) {
        // If phase is complete, move to next phase (if available)
        if (questionsInPhase >= phaseDefinitions[phase].maxQuestions && i < phases.length - 1) {
          return phases[i + 1];
        }
        return phase;
      }
    }
    
    return 'introduction';
  };

  const phaseQuestionCounts = calculatePhaseQuestionCounts(writerMessages);
  const correctPhase = determineCorrectPhase(phaseQuestionCounts);
  
  // Get current phase question number and max
  const currentPhaseQuestionCount = phaseQuestionCounts[correctPhase] || 0;
  const currentPhaseMaxQuestions = phaseDefinitions[correctPhase]?.maxQuestions || 3;

  // Update database when phase or question counts change
  useEffect(() => {
    if (!sessionId) return;
    
    const needsUpdate = 
      correctPhase !== currentPhase || 
      JSON.stringify(phaseQuestionCounts) !== JSON.stringify(sessionData?.phase_question_counts || {});
    
    if (needsUpdate) {
      const updateSession = async () => {
        try {
          const { error } = await supabase
            .from('chat_sessions')
            .update({ 
              current_phase: correctPhase,
              phase_question_counts: phaseQuestionCounts
            })
            .eq('id', sessionId);

          if (error) {
            if (isDev) console.error('Error updating session:', error);
          } else {
            if (isDev) {
              console.log(`📊 Session updated: ${currentPhase} → ${correctPhase}`);
              console.log(`📊 Phase question counts:`, phaseQuestionCounts);
              console.log(`📊 Current phase: ${correctPhase} (${currentPhaseQuestionCount}/${currentPhaseMaxQuestions})`);
            }
          }
        } catch (error) {
          if (isDev) console.error('Failed to update session:', error);
        }
      };
      updateSession();
    }
  }, [sessionId, correctPhase, currentPhase, phaseQuestionCounts, currentPhaseQuestionCount, currentPhaseMaxQuestions, sessionData?.phase_question_counts]);

  // Function to trigger summary -> recommendations transition
  const triggerNextPhase = async () => {
    if (correctPhase === 'summary' && sessionId) {
      try {
        const updatedCounts = { ...phaseQuestionCounts, summary: phaseDefinitions.summary.maxQuestions };
        const { error } = await supabase
          .from('chat_sessions')
          .update({ 
            current_phase: 'recommendations',
            phase_question_counts: updatedCounts,
            phase_metadata: {
              ...sessionData?.phase_metadata,
              manual_transition: true,
              transition_reason: 'User requested recommendations'
            }
          })
          .eq('id', sessionId);

        if (error) {
          if (isDev) console.error('Error updating to recommendations phase:', error);
        } else {
          if (isDev) console.log('Successfully updated to recommendations phase');
        }
      } catch (error) {
        if (isDev) console.error('Failed to update to recommendations phase:', error);
      }
    }
  };

  return {
    currentPhase: correctPhase,
    questionCount: currentPhaseQuestionCount, // Current phase question number
    maxQuestions: currentPhaseMaxQuestions, // Max questions for current phase
    totalQuestions: writerMessages.length, // Total questions across all phases
    phaseQuestionCounts, // Questions per phase breakdown
    triggerNextPhase,
    canTriggerNextPhase: correctPhase === 'summary'
  };
};