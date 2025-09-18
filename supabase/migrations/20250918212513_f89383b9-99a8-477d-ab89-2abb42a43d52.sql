-- Clean up work experience data - remove all "republic 2.0" and "bind.solutions" references from profiles except the main user
-- First, let's see what the current user_id is (we'll keep data for the first profile created as it's likely the main user)
UPDATE public.profiles 
SET work_experience = NULL
WHERE user_id != (
  SELECT user_id FROM public.profiles ORDER BY created_at ASC LIMIT 1
)
AND (
  work_experience::text ILIKE '%republic%2.0%' 
  OR work_experience::text ILIKE '%bind.solutions%'
  OR work_experience::text ILIKE '%bind solutions%'
);

-- Also clean up any bio references to these terms for non-main users
UPDATE public.profiles 
SET bio = CASE 
  WHEN bio ILIKE '%republic%2.0%' OR bio ILIKE '%bind.solutions%' OR bio ILIKE '%bind solutions%' THEN 
    regexp_replace(
      regexp_replace(
        regexp_replace(bio, 'Republic 2\.0[^.]*\.', '', 'gi'),
        'BIND Solutions[^.]*\.', '', 'gi'
      ),
      'bind\.solutions[^.]*\.', '', 'gi'
    )
  ELSE bio
END
WHERE user_id != (
  SELECT user_id FROM public.profiles ORDER BY created_at ASC LIMIT 1
)
AND (
  bio ILIKE '%republic%2.0%' 
  OR bio ILIKE '%bind.solutions%'
  OR bio ILIKE '%bind solutions%'
);