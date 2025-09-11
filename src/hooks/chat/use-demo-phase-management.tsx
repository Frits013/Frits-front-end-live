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
  
  // Use -1 counting logic for total progress: count all user messages and subtract 1 for the initial message
  const allUserMessages = messages.filter(msg => msg.role === 'user');
  const userAnswerCount = Math.max(0, allUserMessages.length - 1);
  
  console.log('🔍 Demo phase management - Total messages:', messages.length, 'User messages:', allUserMessages.length, 'Actual answers:', userAnswerCount);
  
  // Phase determination using userAnswerCount (which already has -1 applied)
  let currentPhase: InterviewPhase = 'introduction';
  let currentPhaseAnswers = 0;
  
  if (userAnswerCount < 3) {
    currentPhase = 'introduction';
    currentPhaseAnswers = userAnswerCount; // This is correct: 0, 1, 2
  } else if (userAnswerCount < 7) {
    currentPhase = 'theme_selection';
    currentPhaseAnswers = userAnswerCount - 3; // This is correct: 0, 1, 2, 3
  } else if (userAnswerCount < 17) {
    currentPhase = 'deep_dive';
    currentPhaseAnswers = userAnswerCount - 7; // This is correct: 0, 1, 2, ..., 9
  } else if (userAnswerCount < 18) {
    currentPhase = 'summary';
    currentPhaseAnswers = userAnswerCount - 17; // This is correct: 0
  } else {
    currentPhase = 'recommendations';
    currentPhaseAnswers = userAnswerCount - 18; // This is correct: 0
  }
  
  const maxQuestionsInCurrentPhase = phaseDefinitions[currentPhase].maxQuestions;
  
  // Simple phase question counts - same logic as above
  const phaseQuestionCounts: Record<string, number> = {};
  
  if (userAnswerCount > 0) {
    phaseQuestionCounts.introduction = Math.min(userAnswerCount, 3);
  }
  if (userAnswerCount > 3) {
    phaseQuestionCounts.theme_selection = Math.min(userAnswerCount - 3, 4);
  }
  if (userAnswerCount > 7) {
    phaseQuestionCounts.deep_dive = Math.min(userAnswerCount - 7, 10);
  }
  if (userAnswerCount > 17) {
    phaseQuestionCounts.summary = Math.min(userAnswerCount - 17, 1);
  }
  if (userAnswerCount > 18) {
    phaseQuestionCounts.recommendations = Math.min(userAnswerCount - 18, 1);
  }

  // Update database when phase changes
  useEffect(() => {
    if (!sessionId) return;
    
    const dbCurrentPhase = sessionData?.current_phase || 'introduction';
    if (currentPhase !== dbCurrentPhase) {
      supabase
        .from('chat_sessions')
        .update({ 
          current_phase: currentPhase,
          phase_question_counts: phaseQuestionCounts
        })
        .eq('id', sessionId);
    }
  }, [sessionId, currentPhase, sessionData?.current_phase]);

  const triggerNextPhase = async () => {
    if (currentPhase === 'summary' && sessionId) {
      const updatedCounts = { ...phaseQuestionCounts, summary: phaseDefinitions.summary.maxQuestions };
      await supabase
        .from('chat_sessions')
        .update({ 
          current_phase: 'recommendations',
          phase_question_counts: updatedCounts
        })
        .eq('id', sessionId);
    }
  };

  return {
    currentPhase,
    answerCount: currentPhaseAnswers,
    currentQuestionNumber: currentPhaseAnswers + 1,
    maxQuestions: maxQuestionsInCurrentPhase,
    totalQuestions: userAnswerCount,
    phaseQuestionCounts,
    triggerNextPhase,
    canTriggerNextPhase: currentPhase === 'summary'
  };
};