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
  
  // Count writer messages (backend has processed these)
  const writerMessages = messages.filter(msg => msg.role === 'writer');
  
  // Count user answers (exclude initial message)
  const userMessages = messages.filter(msg => msg.role === 'user');
  const userAnswerCount = Math.max(0, userMessages.length - 1);
  
  // Determine current phase based on user answers
  const phases = Object.keys(phaseDefinitions) as InterviewPhase[];
  let currentPhase: InterviewPhase = 'introduction';
  let totalUsedAnswers = 0;
  let currentPhaseAnswers = 0;
  
  for (const phase of phases) {
    const maxForPhase = phaseDefinitions[phase as InterviewPhase].maxQuestions;
    
    if (userAnswerCount <= totalUsedAnswers + maxForPhase) {
      currentPhase = phase as InterviewPhase;
      currentPhaseAnswers = userAnswerCount - totalUsedAnswers;
      break;
    }
    
    totalUsedAnswers += maxForPhase;
  }
  
  const maxQuestionsInCurrentPhase = phaseDefinitions[currentPhase].maxQuestions;
  
  // Calculate phase question counts
  const phaseQuestionCounts: Record<string, number> = {};
  let answersLeft = userAnswerCount;
  
  for (const phase of phases) {
    const maxForPhase = phaseDefinitions[phase as InterviewPhase].maxQuestions;
    const answersForPhase = Math.min(answersLeft, maxForPhase);
    
    if (answersForPhase > 0) {
      phaseQuestionCounts[phase] = answersForPhase;
      answersLeft -= answersForPhase;
    }
    
    if (answersLeft <= 0) break;
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