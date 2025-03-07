
export interface ChatMessage {
  id: string;
  content: string;
  role: string;
  created_at: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

export interface MultiAgentState {
  reviewer_approval: boolean;
  Final_response: string;
  internalconversation: ChatMessage[];
  Frits_run_user_prompt: ChatMessage[];
  Frits_response: ChatMessage[];
  RAG_input?: string;
  RAG_response?: string;
  reviewer_answer_check_run_message_history: ChatMessage[];
  reviewer_context_check_run_message_history: ChatMessage[];
  reviewer_feedback: ChatMessage[];
  summary: string;
  summarizer_response: string[];
}
