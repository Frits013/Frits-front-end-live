export interface Message {
  id: string;
  message: string;
  role: 'user' | 'assistant';
  created_at: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}