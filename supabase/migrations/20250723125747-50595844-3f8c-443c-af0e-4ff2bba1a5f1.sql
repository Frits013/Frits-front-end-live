-- Create ENUM type for interview phases
CREATE TYPE interview_phase AS ENUM (
  'introduction',
  'theme_selection', 
  'deep_dive',
  'summary',
  'recommendations'
);

-- Extend chat_sessions table with phase tracking
ALTER TABLE chat_sessions 
ADD COLUMN current_phase interview_phase DEFAULT 'introduction',
ADD COLUMN phase_metadata JSONB DEFAULT '{}',
ADD COLUMN phase_question_counts JSONB DEFAULT '{}',
ADD COLUMN phase_max_questions JSONB DEFAULT '{"introduction": 3, "theme_selection": 5, "deep_dive": 8, "summary": 3, "recommendations": 2}',
ADD COLUMN phase_completion_criteria JSONB DEFAULT '{}';

-- Create interview_progress table for detailed phase tracking
CREATE TABLE interview_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  phase interview_phase NOT NULL,
  questions_asked INTEGER DEFAULT 0,
  completion_confidence DECIMAL(3,2) DEFAULT 0.0,
  selected_themes JSONB DEFAULT '[]',
  insights JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create interview_phases_config table for flexible phase management
CREATE TABLE interview_phases_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phase interview_phase NOT NULL UNIQUE,
  max_questions INTEGER NOT NULL,
  system_prompt TEXT NOT NULL,
  completion_threshold DECIMAL(3,2) DEFAULT 0.8,
  phase_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE interview_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_phases_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for interview_progress
CREATE POLICY "Users can view their own interview progress" 
ON interview_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview progress" 
ON interview_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview progress" 
ON interview_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for interview_phases_config (read-only for authenticated users)
CREATE POLICY "Authenticated users can view phase config" 
ON interview_phases_config FOR SELECT 
USING (auth.role() = 'authenticated');

-- Insert default phase configurations
INSERT INTO interview_phases_config (phase, max_questions, system_prompt, phase_description) VALUES
('introduction', 3, 'You are conducting the introduction phase of a professional consultation. Focus on understanding the user''s background and setting expectations. Keep questions conversational and welcoming.', 'Getting to know you and understanding your consultation needs'),
('theme_selection', 5, 'You are helping identify key themes and areas of focus for this consultation. Ask targeted questions to uncover the main topics the user wants to explore. Guide them toward 2-3 core themes.', 'Identifying the main themes and focus areas for our discussion'),
('deep_dive', 8, 'You are conducting a deep dive analysis of the selected themes. Ask detailed, probing questions to fully understand the user''s situation, challenges, and context around each theme.', 'Exploring your selected themes in depth'),
('summary', 3, 'You are summarizing the key insights and findings from the consultation. Present back what you''ve learned and confirm understanding before moving to recommendations.', 'Summarizing insights and confirming understanding'),
('recommendations', 2, 'You are providing actionable recommendations based on the consultation. Focus on practical, specific advice and next steps the user can take.', 'Providing personalized recommendations and next steps');

-- Create triggers for updating timestamps
CREATE TRIGGER update_interview_progress_updated_at
  BEFORE UPDATE ON interview_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_phases_config_updated_at
  BEFORE UPDATE ON interview_phases_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();