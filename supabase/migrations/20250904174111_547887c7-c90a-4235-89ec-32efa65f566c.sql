-- Drop the unused interview_progress table
DROP TABLE IF EXISTS public.interview_progress;

-- Remove unused columns from chat_sessions table (keep selected_themes but change to jsonb)
ALTER TABLE public.chat_sessions 
DROP COLUMN IF EXISTS phase_completion_criteria,
DROP COLUMN IF EXISTS theme_selection_confidence,
DROP COLUMN IF EXISTS session_context;

-- Change selected_themes from text[] to jsonb
ALTER TABLE public.chat_sessions 
ALTER COLUMN selected_themes TYPE jsonb USING to_jsonb(selected_themes);