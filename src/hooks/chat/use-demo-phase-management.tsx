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
  'theme_selection': { maxQuestions: 4, order: 1 },
  'deep_dive': { maxQuestions: 8, order: 2 },
  'summary': { maxQuestions: 3, order: 3 },
  'recommendations': { maxQuestions: 2, order: 4 }
};

export const useDemoPhaseManagement = ({
  sessionId,
  messages,
  sessionData
}: DemoPhaseManagementProps) => {
  // Filter for assistant messages (converted from 'writer' in useMessageFetcher)
  const assistantMessages = messages.filter(msg => msg.role === 'assistant');
  
  if (isDev) {
    console.log(`📊 Total messages: ${messages.length}, Assistant messages: ${assistantMessages.length}`);
    console.log(`📊 Message roles:`, messages.map(m => m.role));
  }
  const currentPhase = (sessionData?.current_phase || 'introduction') as InterviewPhase;
  
  // Calculate phase question counts from messages
  const calculatePhaseQuestionCounts = (messages: ChatMessage[]): Record<string, number> => {
    const phaseQuestionCounts: Record<string, number> = {};
    const phases = Object.keys(phaseDefinitions) as InterviewPhase[];
    let currentPhaseIndex = 0;
    let questionsInCurrentPhase = 0;
    
    if (isDev) console.log(`📊 Calculating phase counts for ${messages.length} assistant messages`);
    
    // Allocate messages to phases sequentially
    messages.forEach((_, messageIndex) => {
      const currentPhase = phases[currentPhaseIndex];
      const maxQuestionsForPhase = phaseDefinitions[currentPhase].maxQuestions;
      
      questionsInCurrentPhase++;
      
      if (isDev) {
        console.log(`📊 Message ${messageIndex + 1}: Phase ${currentPhase} (${questionsInCurrentPhase}/${maxQuestionsForPhase})`);
      }
      
      // If we've reached the max questions for this phase, finalize it and move to next
      if (questionsInCurrentPhase >= maxQuestionsForPhase) {
        phaseQuestionCounts[currentPhase] = maxQuestionsForPhase;
        
        if (isDev) {
          console.log(`📊 Phase ${currentPhase} completed with ${maxQuestionsForPhase} questions`);
        }
        
        // Move to next phase if available
        if (currentPhaseIndex < phases.length - 1) {
          currentPhaseIndex++;
          questionsInCurrentPhase = 0;
        }
      } else {
        // Update count for current phase
        phaseQuestionCounts[currentPhase] = questionsInCurrentPhase;
      }
    });
    
    if (isDev) {
      console.log(`📊 Final phase question counts:`, phaseQuestionCounts);
    }
    
    return phaseQuestionCounts;
  };

  // Determine correct phase based on completed phases
  const determineCorrectPhase = (phaseQuestionCounts: Record<string, number>): InterviewPhase => {
    const phases = Object.keys(phaseDefinitions) as InterviewPhase[];
    
    // Find the last phase that has questions
    for (let i = phases.length - 1; i >= 0; i--) {
      const phase = phases[i];
      const questionsInPhase = phaseQuestionCounts[phase] || 0;
      
      if (questionsInPhase > 0) {
        const maxQuestionsForPhase = phaseDefinitions[phase].maxQuestions;
        
        if (isDev) {
          console.log(`📊 Phase ${phase}: ${questionsInPhase}/${maxQuestionsForPhase} questions`);
        }
        
        // If phase is complete and there's a next phase, return next phase
        if (questionsInPhase >= maxQuestionsForPhase && i < phases.length - 1) {
          const nextPhase = phases[i + 1];
          if (isDev) {
            console.log(`📊 Phase ${phase} complete, moving to ${nextPhase}`);
          }
          return nextPhase;
        }
        
        // Otherwise return current phase
        return phase;
      }
    }
    
    // Fallback to introduction if no questions found
    return 'introduction';
  };

  const phaseQuestionCounts = calculatePhaseQuestionCounts(assistantMessages);
  const correctPhase = determineCorrectPhase(phaseQuestionCounts);
  
  // Get current phase question number and max
  const currentPhaseQuestionCount = phaseQuestionCounts[correctPhase] || 0;
  const currentPhaseMaxQuestions = phaseDefinitions[correctPhase]?.maxQuestions || 3;

  if (isDev) {
    console.log(`📊 Current phase: ${correctPhase} (${currentPhaseQuestionCount}/${currentPhaseMaxQuestions})`);
    console.log(`📊 Database phase: ${currentPhase}`);
  }

  // Update database when phase or question counts change
  useEffect(() => {
    if (!sessionId) return;
    
    const needsUpdate = 
      correctPhase !== currentPhase || 
      JSON.stringify(phaseQuestionCounts) !== JSON.stringify(sessionData?.phase_question_counts || {});
    
    if (needsUpdate) {
      const updateSession = async () => {
        try {
          if (isDev) {
            console.log(`📊 Updating session: ${currentPhase} → ${correctPhase}`);
            console.log(`📊 Old phase counts:`, sessionData?.phase_question_counts || {});
            console.log(`📊 New phase counts:`, phaseQuestionCounts);
          }

          const { error } = await supabase
            .from('chat_sessions')
            .update({ 
              current_phase: correctPhase,
              phase_question_counts: phaseQuestionCounts
            })
            .eq('id', sessionId);

          if (error) {
            if (isDev) console.error('❌ Error updating session:', error);
          } else {
            if (isDev) {
              console.log(`✅ Session updated successfully`);
              console.log(`📊 Current phase: ${correctPhase} (${currentPhaseQuestionCount}/${currentPhaseMaxQuestions})`);
            }
          }
        } catch (error) {
          if (isDev) console.error('❌ Failed to update session:', error);
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
    totalQuestions: assistantMessages.length, // Total questions across all phases
    phaseQuestionCounts, // Questions per phase breakdown
    triggerNextPhase,
    canTriggerNextPhase: correctPhase === 'summary'
  };
};