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
  // State to track progress and prevent regression
  const [lastKnownProgress, setLastKnownProgress] = useState<{
    sessionId: string | null;
    userAnswerCount: number;
    currentPhaseQuestionCount: number;
    currentPhase: InterviewPhase;
  } | null>(null);

  // Reset progress tracking when session changes
  useEffect(() => {
    if (sessionId && (!lastKnownProgress || sessionId !== lastKnownProgress.sessionId)) {
      setLastKnownProgress(null);
      if (isDev) {
        console.log(`📊 Progress tracking COMPLETELY RESET for new session: ${sessionId}`);
        console.log(`📊 Previous session was: ${lastKnownProgress?.sessionId || 'none'}`);
      }
    }
  }, [sessionId]); // Remove circular dependency

  // Filter for assistant messages - include both 'assistant' AND 'writer' roles
  // since messages might be in 'writer' state during backend processing transition
  const assistantMessages = messages.filter(msg => msg.role === 'assistant' || msg.role === 'writer');
  
  if (isDev) {
    console.log(`📊 === MESSAGE ANALYSIS ===`);
    console.log(`📊 Total messages: ${messages.length}, Assistant messages: ${assistantMessages.length}`);
    console.log(`📊 Message roles:`, messages.map(m => `${m.role}(${m.id?.slice(-4) || 'no-id'})`));
    console.log(`📊 User messages:`, messages.filter(m => m.role === 'user').map(m => `"${m.content.substring(0, 30)}..."`));
    
    // Check for role inconsistencies
    const writerCount = messages.filter(msg => msg.role === 'writer').length;
    const assistantCount = messages.filter(msg => msg.role === 'assistant').length;
    if (writerCount > 0) {
      console.log(`⚠️ Found ${writerCount} writer messages and ${assistantCount} assistant messages`);
    }
  }
  const currentPhase = (sessionData?.current_phase || 'introduction') as InterviewPhase;
  
  // Calculate phase question counts based on user answers (for database tracking)
  const calculatePhaseQuestionCounts = (userAnswerCount: number): Record<string, number> => {
    const phaseQuestionCounts: Record<string, number> = {};
    const phases = Object.keys(phaseDefinitions) as InterviewPhase[];
    let answersUsed = 0;
    
    if (isDev) console.log(`📊 Calculating phase counts for ${userAnswerCount} user answers`);
    
    // Allocate user answers to phases sequentially
    for (let i = 0; i < phases.length && answersUsed < userAnswerCount; i++) {
      const phase = phases[i];
      const maxQuestionsForPhase = phaseDefinitions[phase].maxQuestions;
      const answersInThisPhase = Math.min(userAnswerCount - answersUsed, maxQuestionsForPhase);
      
      if (answersInThisPhase > 0) {
        phaseQuestionCounts[phase] = answersInThisPhase;
        answersUsed += answersInThisPhase;
        
        if (isDev) {
          console.log(`📊 Phase ${phase}: ${answersInThisPhase}/${maxQuestionsForPhase} answers`);
        }
      }
    }
    
    if (isDev) {
      console.log(`📊 Final phase question counts:`, phaseQuestionCounts);
    }
    
    return phaseQuestionCounts;
  };

  // Determine correct phase based on USER ANSWERS (not assistant messages)
  const determineCorrectPhase = (
    phaseQuestionCounts: Record<string, number>, 
    isUserAnswering: boolean = false, 
    userJustFinishedAnswering: boolean = false,
    userAnswerCount: number = 0
  ): InterviewPhase => {
    const phases = Object.keys(phaseDefinitions) as InterviewPhase[];
    
    // Calculate how many answers we have so far
    const totalAnswers = userAnswerCount;
    
    if (isDev) {
      console.log(`📊 Determining phase based on user answers: ${totalAnswers}`);
    }
    
    // PHASE DETECTION based on USER ANSWERS COMPLETED
    let answersUsed = 0;
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const maxQuestionsForPhase = phaseDefinitions[phase].maxQuestions;
      
      // If we have enough user answers to complete this phase, continue to next phase
      if (totalAnswers >= answersUsed + maxQuestionsForPhase) {
        answersUsed += maxQuestionsForPhase;
        continue;
      }
      
      // We're in this phase based on user answers
      if (isDev) {
        const answersInThisPhase = totalAnswers - answersUsed;
        console.log(`📊 Phase determined by user answers: ${phase} (${answersInThisPhase}/${maxQuestionsForPhase} answers completed)`);
      }
      return phase;
    }
    
    // If we've completed all answers, we're in the final phase
    return phases[phases.length - 1];
  };

  // Get all user messages (including initial message)
  const allUserMessages = messages.filter(msg => msg.role === 'user');
  
  // Calculate actual user answers by subtracting 1 for the initial message
  const rawUserAnswerCount = Math.max(0, allUserMessages.length - 1);
  
  // Enhanced user answer counting with better defensive logic
  let userAnswerCount = rawUserAnswerCount;
  
  // Only apply defensive logic if we're in the SAME session and have valid progress tracking
  const isSameSession = lastKnownProgress && lastKnownProgress.sessionId === sessionId && sessionId;
  if (isSameSession && rawUserAnswerCount < lastKnownProgress.userAnswerCount) {
    if (isDev) {
      console.log(`🛡️ REGRESSION DETECTED - User answers: ${rawUserAnswerCount} → ${lastKnownProgress.userAnswerCount} (prevented)`);
    }
    // Instead of just using the old value, use the MAXIMUM to allow progression
    userAnswerCount = Math.max(rawUserAnswerCount, lastKnownProgress.userAnswerCount);
  } else if (lastKnownProgress && lastKnownProgress.sessionId !== sessionId) {
    // Different session detected - use raw count and ignore stale data
    if (isDev) {
      console.log(`🔄 Different session detected - ignoring stale progress data`);
    }
    userAnswerCount = rawUserAnswerCount;
  } else if (isSameSession && rawUserAnswerCount > lastKnownProgress.userAnswerCount) {
    // Forward progress detected - allow it immediately
    if (isDev) {
      console.log(`📈 PROGRESS DETECTED - User answers: ${lastKnownProgress.userAnswerCount} → ${rawUserAnswerCount} (allowed)`);
    }
    userAnswerCount = rawUserAnswerCount;
  }
  
  if (isDev) {
    console.log(`📊 User answer count: ${rawUserAnswerCount} (raw) → ${userAnswerCount} (final)`);
  }

  // Calculate phase question counts based on user answers
  const phaseQuestionCounts = calculatePhaseQuestionCounts(userAnswerCount);
  
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
  let rawCurrentPhaseQuestionCount = 0;
  
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const maxQuestionsForPhase = phaseDefinitions[phase].maxQuestions;
    
    if (phase === correctPhase) {
      // This is the number of answers completed in this phase
      rawCurrentPhaseQuestionCount = Math.max(0, totalAnswers - answersUsed);
      break;
    }
    
    answersUsed += maxQuestionsForPhase;
  }
  
  // Enhanced phase progress defensive logic
  let currentPhaseQuestionCount = rawCurrentPhaseQuestionCount;
  
  // Only apply defensive logic for the same session, same phase
  if (isSameSession && 
      lastKnownProgress.currentPhase === correctPhase &&
      rawCurrentPhaseQuestionCount < lastKnownProgress.currentPhaseQuestionCount) {
    if (isDev) {
      console.log(`🛡️ REGRESSION DETECTED - Phase progress: ${rawCurrentPhaseQuestionCount} → ${lastKnownProgress.currentPhaseQuestionCount} (prevented)`);
    }
    // Use maximum to allow forward progress while preventing regression
    currentPhaseQuestionCount = Math.max(rawCurrentPhaseQuestionCount, lastKnownProgress.currentPhaseQuestionCount);
  } else if (lastKnownProgress && lastKnownProgress.sessionId !== sessionId) {
    // Different session - use raw count
    if (isDev) {
      console.log(`🔄 Different session detected - using raw phase progress: ${rawCurrentPhaseQuestionCount}`);
    }
    currentPhaseQuestionCount = rawCurrentPhaseQuestionCount;
  } else if (isSameSession && 
             lastKnownProgress.currentPhase === correctPhase &&
             rawCurrentPhaseQuestionCount > lastKnownProgress.currentPhaseQuestionCount) {
    // Forward progress in same phase - allow it immediately
    if (isDev) {
      console.log(`📈 PHASE PROGRESS DETECTED: ${lastKnownProgress.currentPhaseQuestionCount} → ${rawCurrentPhaseQuestionCount} (allowed)`);
    }
    currentPhaseQuestionCount = rawCurrentPhaseQuestionCount;
  }
  
  const currentPhaseMaxQuestions = phaseDefinitions[correctPhase]?.maxQuestions || 3;

  if (isDev) {
    console.log(`📊 ===================`);
    console.log(`📊 FINAL CALCULATIONS:`);
    console.log(`📊 User messages total: ${allUserMessages.length} (including initial)`);
    console.log(`📊 User answers (raw): ${rawUserAnswerCount} (total - 1)`);
    console.log(`📊 User answers (final): ${userAnswerCount}`);
    console.log(`📊 Current phase: ${correctPhase} (determined by user answers)`);
    console.log(`📊 Phase progress: ${rawCurrentPhaseQuestionCount} raw → ${currentPhaseQuestionCount} final / ${currentPhaseMaxQuestions}`);
    console.log(`📊 Question counter will show: ${currentPhaseQuestionCount + 1}/${currentPhaseMaxQuestions}`);
    console.log(`📊 Database phase: ${currentPhase}`);
    console.log(`📊 Assistant messages: ${assistantMessages.length}`);
    console.log(`📊 ===================`);
  }

  // Update progress tracking when progress advances (prevent infinite re-renders with useEffect)
  useEffect(() => {
    const shouldUpdate = 
      userAnswerCount >= (lastKnownProgress?.userAnswerCount || 0) && 
      currentPhaseQuestionCount >= (lastKnownProgress?.currentPhaseQuestionCount || 0) &&
      (
        !lastKnownProgress ||
        lastKnownProgress.sessionId !== sessionId ||
        lastKnownProgress.userAnswerCount !== userAnswerCount ||
        lastKnownProgress.currentPhaseQuestionCount !== currentPhaseQuestionCount ||
        lastKnownProgress.currentPhase !== correctPhase
      );

    if (shouldUpdate) {
      setLastKnownProgress({
        sessionId,
        userAnswerCount,
        currentPhaseQuestionCount,
        currentPhase: correctPhase
      });
      if (isDev) {
        console.log(`📊 Progress tracking updated: answers=${userAnswerCount}, phase=${correctPhase}(${currentPhaseQuestionCount})`);
      }
    }
  }, [sessionId, userAnswerCount, currentPhaseQuestionCount, correctPhase]);

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
  }, [sessionId, correctPhase, currentPhase, phaseQuestionCounts, currentPhaseQuestionCount, sessionData?.phase_question_counts]);

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