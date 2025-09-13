-- Add is_public column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_public boolean NOT NULL DEFAULT true;

-- Update existing profiles to be public by default
UPDATE public.profiles SET is_public = true WHERE is_public IS NULL;

-- Create index for better performance on public profile searches
CREATE INDEX idx_profiles_public ON public.profiles(is_public) WHERE is_public = true;

-- Update the public profile functions to respect privacy settings
CREATE OR REPLACE FUNCTION public.get_public_profile_data(target_user_id uuid)
 RETURNS TABLE(id uuid, user_id uuid, display_name text, avatar_url text, bio text, location text, company text, job_title text, website_url text, skills text[], interests text[], social_links jsonb, created_at timestamp with time zone, updated_at timestamp with time zone, ai_processed boolean, profile_completeness integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  WHERE p.user_id = target_user_id 
  AND (p.is_public = true OR p.user_id = auth.uid());
$function$;

-- Update public profiles list function to only show public profiles
CREATE OR REPLACE FUNCTION public.get_public_profiles_list(user_ids uuid[])
 RETURNS TABLE(id uuid, user_id uuid, display_name text, avatar_url text, bio text, location text, company text, job_title text, website_url text, skills text[], interests text[], created_at timestamp with time zone, updated_at timestamp with time zone, ai_processed boolean, profile_completeness integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  AND p.user_id != auth.uid() -- Exclude the current user's own profile
  AND p.is_public = true; -- Only show public profiles
$function$;

-- Create function to search public profiles by name
CREATE OR REPLACE FUNCTION public.search_public_profiles(search_term text)
 RETURNS TABLE(id uuid, user_id uuid, display_name text, avatar_url text, bio text, location text, company text, job_title text, website_url text, skills text[], interests text[], created_at timestamp with time zone, updated_at timestamp with time zone, ai_processed boolean, profile_completeness integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  WHERE p.is_public = true
  AND p.user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  AND (
    p.display_name ILIKE '%' || search_term || '%'
    OR p.company ILIKE '%' || search_term || '%'
    OR p.job_title ILIKE '%' || search_term || '%'
    OR p.location ILIKE '%' || search_term || '%'
  )
  ORDER BY 
    CASE WHEN p.display_name ILIKE search_term || '%' THEN 1 ELSE 2 END,
    p.display_name;
$function$;