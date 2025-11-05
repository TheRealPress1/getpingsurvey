-- Create circles table
CREATE TABLE IF NOT EXISTS public.circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#00FF66',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own circles"
  ON public.circles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own circles"
  ON public.circles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own circles"
  ON public.circles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own circles"
  ON public.circles FOR DELETE
  USING (auth.uid() = user_id);

-- Create circle_members table
CREATE TABLE IF NOT EXISTS public.circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  position_z FLOAT DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, contact_id)
);

ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their circle members"
  ON public.circle_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add members to their circles"
  ON public.circle_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their circle members"
  ON public.circle_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their circle members"
  ON public.circle_members FOR DELETE
  USING (auth.uid() = user_id);

-- Create relationship_goals table
CREATE TABLE IF NOT EXISTS public.relationship_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  contact_frequency_days INTEGER DEFAULT 14,
  monthly_call_minutes INTEGER DEFAULT 60,
  monthly_messages INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, contact_id)
);

ALTER TABLE public.relationship_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their relationship goals"
  ON public.relationship_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create health_scores table
CREATE TABLE IF NOT EXISTS public.health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  frequency_score INTEGER,
  recency_score INTEGER,
  reciprocity_score INTEGER,
  consistency_score INTEGER,
  last_contact_days INTEGER,
  total_interactions INTEGER,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, contact_id)
);

ALTER TABLE public.health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their health scores"
  ON public.health_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage health scores"
  ON public.health_scores FOR ALL
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');

-- Alter existing interactions table to add new columns
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS direction TEXT CHECK (direction IN ('sent', 'received', 'mutual'));
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS user_id UUID;

-- Update user_id for existing interactions
UPDATE public.interactions SET user_id = (SELECT user_id FROM public.contacts WHERE contacts.id = interactions.contact_id) WHERE user_id IS NULL;

-- Add occurred_at from date column
UPDATE public.interactions SET occurred_at = date::timestamptz WHERE occurred_at IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON public.circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_user ON public.circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_contact ON public.interactions(user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_occurred_at ON public.interactions(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_scores_user ON public.health_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_score ON public.health_scores(score DESC);

-- Add circles_onboarded to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS circles_onboarded BOOLEAN DEFAULT FALSE;

-- Create trigger for relationship_goals updated_at
CREATE OR REPLACE FUNCTION public.update_relationship_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_relationship_goals_updated_at
  BEFORE UPDATE ON public.relationship_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_relationship_goals_updated_at();