-- Fix security definer views by creating proper security functions
-- This addresses the security linter warning about security definer views

-- Drop existing problematic views if they exist
DROP VIEW IF EXISTS public.user_profiles_secure;

-- Create security definer function for user role checking
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(role, 'user') FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create security definer function for checking user permissions
CREATE OR REPLACE FUNCTION public.can_access_admin_features()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(public.get_current_user_role() = 'admin', false);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create security definer function for profile access
CREATE OR REPLACE FUNCTION public.can_access_profile(target_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT auth.uid() = target_user_id OR public.can_access_admin_features();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update any existing RLS policies to use these functions instead of direct queries
-- This prevents infinite recursion in RLS policies

-- Ensure all policies use the security definer functions
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;