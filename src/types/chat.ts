
export interface ChatMessage {
  id: string;
  content: string;
  role: string;
  created_at: Date;
}

export interface ChatSession {
  id: string;
  session_name: string;
  created_at: string;
  finished: boolean;
  user_id: string;
  current_phase?: InterviewPhase;
  phase_metadata?: Record<string, any>;
  phase_question_counts?: Record<string, number>;
  phase_max_questions?: Record<string, number>;
  phase_completion_criteria?: Record<string, any>;
}

// Interview Phase Types
export type InterviewPhase = 'introduction' | 'theme_selection' | 'deep_dive' | 'summary' | 'recommendations';

export interface PhaseInfo {
  current_phase: InterviewPhase;
  progress_percent: number;
  questions_in_phase: number;
  max_questions_in_phase: number;
  should_transition: boolean;
  selected_themes: string[];
  completion_confidence: number;
  phase_metadata?: Record<string, any>;
  insights?: Record<string, any>;
}

export interface PhaseConfig {
  id: string;
  phase: InterviewPhase;
  max_questions: number;
  system_prompt: string;
  completion_threshold: number;
  phase_description: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewProgress {
  id: string;
  session_id: string;
  user_id: string;
  phase: InterviewPhase;
  questions_asked: number;
  completion_confidence: number;
  selected_themes: string[];
  insights: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MultiAgentState {
  reviewer_approval?: boolean;
  Final_response?: string;
  internalconversation?: ChatMessage[];
  Frits_run_user_prompt?: ChatMessage[];
  Frits_response?: ChatMessage[];
  RAG_input?: string;
  RAG_response?: string;
  reviewer_answer_check_run_message_history?: ChatMessage[];
  reviewer_context_check_run_message_history?: ChatMessage[];
  reviewer_feedback?: ChatMessage[];
  summary?: string;
  summarizer_response?: string[];
}

export interface ChatMessageWithState extends ChatMessage {
  multi_agent_state?: MultiAgentState;
  phase_info?: PhaseInfo;
}

export interface ChatResponse {
  response: string;
  session_id: string;
  phase_info?: PhaseInfo;
  error?: string;
}

export interface SessionWithFeedback extends ChatSession {
  hasUserFeedback?: boolean;
  isFinishable?: boolean;
}
