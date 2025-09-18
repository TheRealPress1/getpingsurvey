-- Get the first user (main user - Vaness Gardner) to preserve their data
WITH main_user AS (
  SELECT user_id FROM public.profiles ORDER BY created_at ASC LIMIT 1
)
-- Clean ALL references to Republic 2.0 and Bind Solutions from ALL other profiles
UPDATE public.profiles 
SET 
  work_experience = NULL,
  bio = CASE 
    WHEN bio IS NOT NULL THEN
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(bio, 'Republic 2\.0[^.]*[.]?', '', 'gi'),
              'BIND Solutions[^.]*[.]?', '', 'gi'
            ),
            'bind\.solutions[^.]*[.]?', '', 'gi'
          ),
          'founder of BIND Solutions[^.]*[.]?', '', 'gi'
        ),
        'working on Republic 2\.0[^.]*[.]?', '', 'gi'
      )
    ELSE bio
  END,
  company = CASE 
    WHEN company ILIKE '%bind%' OR company ILIKE '%republic%' THEN NULL
    ELSE company
  END,
  job_title = CASE 
    WHEN job_title ILIKE '%bind%' OR job_title ILIKE '%republic%' OR job_title ILIKE '%founder%' THEN NULL
    ELSE job_title
  END
WHERE user_id NOT IN (SELECT user_id FROM main_user)
AND (
  work_experience IS NOT NULL 
  OR bio ILIKE '%republic%' 
  OR bio ILIKE '%bind%'
  OR company ILIKE '%bind%'
  OR company ILIKE '%republic%'
  OR job_title ILIKE '%bind%'
  OR job_title ILIKE '%republic%'
);