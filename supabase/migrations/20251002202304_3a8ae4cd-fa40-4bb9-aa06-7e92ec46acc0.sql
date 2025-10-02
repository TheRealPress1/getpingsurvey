-- Create waitlist table for pre-launch signups
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert into waitlist (for signup form)
CREATE POLICY "Anyone can join the waitlist"
ON public.waitlist
FOR INSERT
WITH CHECK (true);

-- Only service role can view waitlist entries
CREATE POLICY "Service role can view waitlist"
ON public.waitlist
FOR SELECT
USING (current_setting('role', true) = 'service_role');

-- Create index on email for faster lookups
CREATE INDEX idx_waitlist_email ON public.waitlist(email);

-- Create index on created_at for sorting
CREATE INDEX idx_waitlist_created_at ON public.waitlist(created_at DESC);