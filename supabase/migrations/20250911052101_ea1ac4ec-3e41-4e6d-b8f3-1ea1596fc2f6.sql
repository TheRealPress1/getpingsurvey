-- Create function to get user email for public profiles (security definer)
CREATE OR REPLACE FUNCTION public.get_user_email_for_contact(target_user_id uuid)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT email FROM auth.users WHERE id = target_user_id;
$$;