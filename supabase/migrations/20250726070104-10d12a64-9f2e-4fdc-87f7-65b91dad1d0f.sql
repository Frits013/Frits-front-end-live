-- Phase 2: Database Security Hardening

-- 1. Add comprehensive RLS policies for info_messages table
ALTER TABLE public.info_messages ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own info messages
CREATE POLICY "Users can view their own info messages" 
ON public.info_messages 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for users to insert their own info messages
CREATE POLICY "Users can insert their own info messages" 
ON public.info_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own info messages
CREATE POLICY "Users can update their own info messages" 
ON public.info_messages 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy for users to delete their own info messages
CREATE POLICY "Users can delete their own info messages" 
ON public.info_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- 2. Fix database functions to use proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_user_company(user_uuid uuid, company_code character varying)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  found_company_id uuid;
  rows_affected int;
BEGIN
  -- Find the company_id that matches the code
  SELECT c.company_id INTO found_company_id
  FROM public.companies c
  WHERE c.code = company_code::numeric;

  -- If we found a matching company, update the user's company_id
  IF found_company_id IS NOT NULL THEN
    UPDATE public.users
    SET company_id = found_company_id
    WHERE user_id = user_uuid
    RETURNING 1 INTO rows_affected;
    
    -- Check if update succeeded
    IF rows_affected = 1 THEN
      RETURN true;
    ELSE
      RETURN false; -- User not found
    END IF;
  END IF;

  RETURN false; -- Company code not found
EXCEPTION
  WHEN OTHERS THEN
    RETURN false; -- Handle any other errors gracefully
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.users (user_id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_user_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.users
  SET email = (SELECT email FROM auth.users WHERE id = NEW.user_id)
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$function$;