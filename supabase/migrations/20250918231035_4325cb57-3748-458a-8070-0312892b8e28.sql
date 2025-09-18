-- Remove all featured work from all profiles
UPDATE public.profiles 
SET featured_work = NULL
WHERE featured_work IS NOT NULL;