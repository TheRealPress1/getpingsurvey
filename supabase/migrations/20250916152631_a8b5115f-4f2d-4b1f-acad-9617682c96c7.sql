-- Ensure public RPC returns phone_number so it always shows on Public Profile
CREATE OR REPLACE FUNCTION public.get_public_profile_secure(target_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  bio text,
  location text,
  company text,
  job_title text,
  website_url text,
  phone_number text,
  skills text[],
  interests text[],
  social_links jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
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
    p.phone_number,
    p.skills,
    p.interests,
    p.social_links
  FROM public.profiles p
  WHERE p.user_id = target_user_id
    AND p.is_public = true
$$;

-- Tighten privileges
REVOKE ALL ON FUNCTION public.get_public_profile_secure(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile_secure(uuid) TO anon, authenticated;