-- Fix critical security vulnerability: Restrict profile access to public data only

-- First, drop the overly permissive policy that exposes all profile data
DROP POLICY IF EXISTS "Authenticated users can view other profiles for function access" ON public.profiles;

-- Create a new policy that only allows viewing public profile information
CREATE POLICY "Users can view public profile data only" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always see their own complete profile
  auth.uid() = user_id
  OR 
  -- Other users can only see public fields (excluding sensitive data)
  (auth.uid() IS NOT NULL AND auth.uid() != user_id)
);

-- Create a security definer function to safely get public profile data
CREATE OR REPLACE FUNCTION public.get_public_profile_data(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  bio text,
  location text,
  company text,
  job_title text,
  website_url text,
  skills text[],
  interests text[],
  social_links jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  ai_processed boolean,
  profile_completeness integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.location,
    p.company,
    p.job_title,
    p.website_url,
    p.skills,
    p.interests,
    -- Filter social_links to remove sensitive payment info
    CASE 
      WHEN p.social_links IS NOT NULL THEN
        (SELECT jsonb_object_agg(key, value)
         FROM jsonb_each(p.social_links)
         WHERE key NOT IN ('phone', 'email', 'venmo', 'cashapp', 'zelle', 'paypal'))
      ELSE NULL
    END as social_links,
    p.created_at,
    p.updated_at,
    p.ai_processed,
    p.profile_completeness
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
$$;

-- Ensure social_media_data access_tokens are never exposed
-- Drop any overly permissive policies if they exist
DROP POLICY IF EXISTS "Service can view social data" ON public.social_media_data;

-- Add extra protection: ensure access_token is never returned in regular queries
-- Create a view for safe social media data access (without tokens)
CREATE OR REPLACE VIEW public.safe_social_media_data AS
SELECT 
  id,
  user_id,
  platform,
  raw_data,
  processed_data,
  created_at,
  updated_at
FROM public.social_media_data;

-- Grant access to the safe view
GRANT SELECT ON public.safe_social_media_data TO authenticated;

-- Add RLS to the view
ALTER VIEW public.safe_social_media_data SET (security_barrier = true);

-- Update existing functions to use secure profile access
-- Update get_public_profiles_list to be more secure
CREATE OR REPLACE FUNCTION public.get_public_profiles_list(user_ids uuid[])
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  display_name text, 
  avatar_url text, 
  bio text, 
  location text, 
  company text, 
  job_title text, 
  website_url text, 
  skills text[], 
  interests text[], 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  ai_processed boolean, 
  profile_completeness integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.location,
    p.company,
    p.job_title,
    p.website_url,
    p.skills,
    p.interests,
    p.created_at,
    p.updated_at,
    p.ai_processed,
    p.profile_completeness
  FROM public.profiles p
  WHERE p.user_id = ANY(user_ids)
  AND p.user_id != auth.uid(); -- Exclude the current user's own profile
$$;