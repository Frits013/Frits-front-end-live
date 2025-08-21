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
  // Count writer messages and update database phase based on thresholds
  const writerMessages = messages.filter(msg => msg.role === 'writer');
  const currentPhase = (sessionData?.current_phase || 'introduction') as InterviewPhase;
  
  // Phase thresholds based on writer message count
  const getPhaseFromCount = (count: number): InterviewPhase => {
    if (count >= 19) return 'recommendations';
    if (count >= 18) return 'summary';
    if (count >= 8) return 'deep_dive';
    if (count >= 4) return 'theme_selection';
    return 'introduction';
  };

  const expectedPhase = getPhaseFromCount(writerMessages.length);

  // Update database phase when it doesn't match expected phase
  useEffect(() => {
    if (sessionId && expectedPhase !== currentPhase) {
      const updatePhase = async () => {
        try {
          const { error } = await supabase
            .from('chat_sessions')
            .update({ current_phase: expectedPhase })
            .eq('id', sessionId);

          if (error) {
            if (isDev) console.error('Error updating phase:', error);
          } else {
            if (isDev) console.log(`📊 Phase updated: ${currentPhase} → ${expectedPhase} (${writerMessages.length} messages)`);
          }
        } catch (error) {
          if (isDev) console.error('Failed to update phase:', error);
        }
      };
      updatePhase();
    }
  }, [sessionId, expectedPhase, currentPhase, writerMessages.length]);

  if (isDev) {
    console.log(`📊 Phase Management - Current: ${currentPhase}, Expected: ${expectedPhase}, Writer messages: ${writerMessages.length}`);
  }

  // Function to trigger summary -> recommendations transition
  const triggerNextPhase = async () => {
    if (currentPhase === 'summary' && sessionId) {
      try {
        const { error } = await supabase
          .from('chat_sessions')
          .update({ 
            current_phase: 'recommendations',
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
    currentPhase,
    questionCount: writerMessages.length, // Simple count of visible AI responses
    maxQuestions: 19, // Total expected questions across all phases
    triggerNextPhase,
    canTriggerNextPhase: currentPhase === 'summary'
  };
};