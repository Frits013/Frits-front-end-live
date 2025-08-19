-- Update interview_phases_config with new question limits
UPDATE interview_phases_config 
SET max_questions = 4 
WHERE phase = 'theme_selection';

UPDATE interview_phases_config 
SET max_questions = 10 
WHERE phase = 'deep_dive';

UPDATE interview_phases_config 
SET max_questions = 1 
WHERE phase = 'summary';

UPDATE interview_phases_config 
SET max_questions = 1 
WHERE phase = 'recommendations';