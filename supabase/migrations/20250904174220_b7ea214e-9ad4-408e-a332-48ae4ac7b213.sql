-- Drop the unused interview_progress table
DROP TABLE IF EXISTS public.interview_progress;

-- Remove unused columns from chat_sessions table 
ALTER TABLE public.chat_sessions 
DROP COLUMN IF EXISTS phase_completion_criteria,
DROP COLUMN IF EXISTS theme_selection_confidence,
DROP COLUMN IF EXISTS session_context;

-- Change selected_themes from text[] to jsonb (handle default value properly)
ALTER TABLE public.chat_sessions 
ALTER COLUMN selected_themes DROP DEFAULT;

ALTER TABLE public.chat_sessions 
ALTER COLUMN selected_themes TYPE jsonb USING to_jsonb(selected_themes);

ALTER TABLE public.chat_sessions 
ALTER COLUMN selected_themes SET DEFAULT '{}'::jsonb;