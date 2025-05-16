
-- Add a processing column to chat_messages table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'chat_messages'
        AND column_name = 'processing'
    ) THEN
        ALTER TABLE public.chat_messages
        ADD COLUMN processing BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN public.chat_messages.processing IS 'Flag to track if message is being processed by backend';
    END IF;
END
$$;
