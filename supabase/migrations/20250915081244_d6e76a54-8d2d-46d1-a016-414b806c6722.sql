-- Update the cleanup function to handle foreign key constraints properly
CREATE OR REPLACE FUNCTION public.cleanup_user_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    deleted_info_messages INT := 0;
    deleted_feedback INT := 0;
    deleted_chat_messages INT := 0;
    deleted_chat_sessions INT := 0;
    deleted_users INT := 0;
BEGIN
    -- Log the start of deletion process
    RAISE NOTICE 'Starting user data cleanup for user_id: %', OLD.id;
    
    -- Delete info_messages that reference messages from this user OR have no message_id reference
    -- This handles the foreign key constraint properly
    DELETE FROM public.info_messages 
    WHERE user_id = OLD.id 
    OR message_id IN (
        SELECT message_id FROM public.chat_messages WHERE user_id = OLD.id
    );
    GET DIAGNOSTICS deleted_info_messages = ROW_COUNT;
    RAISE NOTICE 'Deleted % info_messages for user %', deleted_info_messages, OLD.id;
    
    -- Delete feedback (references auth.users and chat_sessions)
    DELETE FROM public.feedback WHERE user_id = OLD.id;
    GET DIAGNOSTICS deleted_feedback = ROW_COUNT;
    RAISE NOTICE 'Deleted % feedback records for user %', deleted_feedback, OLD.id;
    
    -- Now safe to delete chat_messages (no more foreign key references)
    DELETE FROM public.chat_messages WHERE user_id = OLD.id;
    GET DIAGNOSTICS deleted_chat_messages = ROW_COUNT;
    RAISE NOTICE 'Deleted % chat_messages for user %', deleted_chat_messages, OLD.id;
    
    -- Delete chat_sessions (references auth.users)
    DELETE FROM public.chat_sessions WHERE user_id = OLD.id;
    GET DIAGNOSTICS deleted_chat_sessions = ROW_COUNT;
    RAISE NOTICE 'Deleted % chat_sessions for user %', deleted_chat_sessions, OLD.id;
    
    -- Delete from users table (references auth.users)
    DELETE FROM public.users WHERE user_id = OLD.id;
    GET DIAGNOSTICS deleted_users = ROW_COUNT;
    RAISE NOTICE 'Deleted % users record for user %', deleted_users, OLD.id;
    
    -- Log completion
    RAISE NOTICE 'User data cleanup completed for user_id: % (info: %, feedback: %, messages: %, sessions: %, users: %)', 
                 OLD.id, deleted_info_messages, deleted_feedback, deleted_chat_messages, deleted_chat_sessions, deleted_users;
    
    RETURN OLD;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error during user data cleanup for user %: %', OLD.id, SQLERRM;
END;
$function$;