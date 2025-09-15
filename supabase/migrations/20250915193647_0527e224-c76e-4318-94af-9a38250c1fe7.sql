-- Fix security vulnerability in profile_processing_jobs table
-- Remove the overly permissive policy that allows all users to access all data
DROP POLICY IF EXISTS "Edge functions can manage processing jobs" ON public.profile_processing_jobs;

-- Create a secure policy that only allows service role (edge functions) to manage jobs
CREATE POLICY "Service role can manage all processing jobs" 
ON public.profile_processing_jobs 
FOR ALL 
USING (current_setting('role', true) = 'service_role');

-- Ensure the existing user policy is properly restrictive
DROP POLICY IF EXISTS "Users can view their own processing jobs" ON public.profile_processing_jobs;

-- Recreate user policy with proper restrictions
CREATE POLICY "Users can view only their own processing jobs" 
ON public.profile_processing_jobs 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Add policy for users to insert their own jobs (needed for profile creation)
CREATE POLICY "Users can insert their own processing jobs" 
ON public.profile_processing_jobs 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());