-- Remove unused theme-related tables since themes are now handled in the backend
-- These tables are not being used in the current codebase

-- Drop tables with foreign key dependencies first
DROP TABLE IF EXISTS public.session_theme_selections;
DROP TABLE IF EXISTS public.user_theme_profiles;

-- Drop the main themes table last
DROP TABLE IF EXISTS public.themes;