-- Update the search_public_profiles function to include bio in search
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
    OR p.bio ILIKE '%' || search_term || '%'
  )
  ORDER BY 
    CASE WHEN p.display_name ILIKE search_term || '%' THEN 1 ELSE 2 END,
    p.display_name;
$function$;