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
  'deep_dive': { maxQuestions: 10, order: 2 },
  'summary': { maxQuestions: 1, order: 3 },
  'recommendations': { maxQuestions: 1, order: 4 }
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

  // Determine correct phase based on assistant messages (predictive) and user answers (progress)
  const determineCorrectPhase = (
    phaseQuestionCounts: Record<string, number>, 
    isUserAnswering: boolean = false, 
    userJustFinishedAnswering: boolean = false,
    userAnswerCount: number = 0
  ): InterviewPhase => {
    const phases = Object.keys(phaseDefinitions) as InterviewPhase[];
    
    // Calculate how many answers we have so far
    const totalAnswers = userAnswerCount;
    const totalAssistantMessages = assistantMessages.length;
    
    if (isDev) {
      console.log(`📊 Total answers: ${totalAnswers}, Assistant messages: ${totalAssistantMessages}`);
    }
    
    // PREDICTIVE PHASE DETECTION: If we have more assistant messages than the current phase allows,
    // we should immediately transition to the next phase to prevent "X+1/X" displays
    let messagesUsed = 0;
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const maxQuestionsForPhase = phaseDefinitions[phase].maxQuestions;
      
      // If we have enough assistant messages to exceed this phase, continue to next phase
      if (totalAssistantMessages > messagesUsed + maxQuestionsForPhase) {
        messagesUsed += maxQuestionsForPhase;
        continue;
      }
      
      // We're in this phase based on assistant messages
      if (isDev) {
        const messagesInThisPhase = totalAssistantMessages - messagesUsed;
        console.log(`📊 Phase determined by assistant messages: ${phase} (${messagesInThisPhase}/${maxQuestionsForPhase})`);
      }
      return phase;
    }
    
    // If we've processed all assistant messages, we're in the final phase
    return phases[phases.length - 1];
  };

  const phaseQuestionCounts = calculatePhaseQuestionCounts(assistantMessages);
  
  // Get all user messages (including initial message)
  const allUserMessages = messages.filter(msg => msg.role === 'user');
  
  // Calculate actual user answers by subtracting 1 for the initial message
  const userAnswerCount = Math.max(0, allUserMessages.length - 1);
  
  if (isDev) {
    console.log(`📊 User answer count: ${userAnswerCount}`);
  }
  
  // Determine if user is currently answering
  // User is answering if the last message is from assistant AND there are fewer user answers than assistant questions
  const lastMessage = messages[messages.length - 1];
  const isUserAnswering = lastMessage?.role === 'assistant' && userAnswerCount < assistantMessages.length;
  
  // Enhanced logic: also check if we're at the exact moment of a phase boundary
  // If we have equal assistant questions and user answers, the user has just finished answering
  const userJustFinishedAnswering = userAnswerCount === assistantMessages.length;
  
  const correctPhase = determineCorrectPhase(phaseQuestionCounts, isUserAnswering, userJustFinishedAnswering, userAnswerCount);
  
  // Calculate the question number within the current phase based on answers
  const phases = Object.keys(phaseDefinitions) as InterviewPhase[];
  const totalAnswers = userAnswerCount;
  
  // Calculate which question number we're on within the current phase
  let answersUsed = 0;
  let currentPhaseQuestionCount = 0;
  
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const maxQuestionsForPhase = phaseDefinitions[phase].maxQuestions;
    
    if (phase === correctPhase) {
      // This is the number of answers completed in this phase
      currentPhaseQuestionCount = Math.max(0, totalAnswers - answersUsed);
      break;
    }
    
    answersUsed += maxQuestionsForPhase;
  }
  
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
    answerCount: currentPhaseQuestionCount, // Number of answers completed in current phase
    currentQuestionNumber: currentPhaseQuestionCount + 1, // Current question being asked (for display)
    maxQuestions: currentPhaseMaxQuestions, // Max questions for current phase
    totalQuestions: totalAnswers, // Total answers given (for overall progress)
    phaseQuestionCounts, // Questions per phase breakdown
    triggerNextPhase,
    canTriggerNextPhase: correctPhase === 'summary'
  };
};