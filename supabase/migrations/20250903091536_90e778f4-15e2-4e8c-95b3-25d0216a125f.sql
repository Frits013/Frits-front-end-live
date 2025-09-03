-- Remove the company codes table and set_user_company function since manual company assignment will be used

-- Drop the set_user_company RPC function
DROP FUNCTION IF EXISTS public.set_user_company(uuid, character varying);

-- Drop the company_codes table 
DROP TABLE IF EXISTS public.company_codes;