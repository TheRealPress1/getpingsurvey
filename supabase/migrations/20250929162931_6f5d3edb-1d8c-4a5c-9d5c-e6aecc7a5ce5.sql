-- Create a table to track profile views/clicks
CREATE TABLE public.profile_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_user_id UUID NOT NULL,
  viewer_user_id UUID NULL, -- NULL for anonymous viewers
  viewer_ip TEXT NULL, -- For anonymous tracking
  user_agent TEXT NULL,
  referrer TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Create policies for profile views
CREATE POLICY "Profile owners can view their own analytics" 
ON public.profile_views 
FOR SELECT 
USING (profile_user_id = auth.uid());

CREATE POLICY "Anyone can insert profile views for tracking" 
ON public.profile_views 
FOR INSERT 
WITH CHECK (true); -- Allow anonymous tracking

-- Create index for performance on common queries
CREATE INDEX idx_profile_views_profile_user_id_created_at 
ON public.profile_views (profile_user_id, created_at DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profile_views_updated_at
BEFORE UPDATE ON public.profile_views
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();