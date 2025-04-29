
-- Enable full replica identity on the chat_sessions table (for realtime)
ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
