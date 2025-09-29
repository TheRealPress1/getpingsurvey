-- Add RLS policy to allow public access only to profiles marked as public
-- This prevents harvesting of private user data while maintaining functionality

CREATE POLICY "Public can view public profiles only" 
ON public.profiles 
FOR SELECT 
USING (is_public = true);

-- Add policy for anonymous users to access public profiles
-- This ensures the get_public_profile_secure function works properly
CREATE POLICY "Anonymous can view public profiles" 
ON public.profiles 
FOR SELECT 
TO anon
USING (is_public = true);