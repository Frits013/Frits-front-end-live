-- Fix function search path issues for security
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $function$
begin
  insert into public.users (user_id, email)
  values (new.id, new.email);
  return new;
end;
$function$;

-- Recreate the trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix set_user_email function search path
DROP FUNCTION IF EXISTS public.set_user_email() CASCADE;
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