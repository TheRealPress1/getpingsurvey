-- Create connections table for user networks
CREATE TABLE public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_user_id)
);

-- Enable Row Level Security
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Create policies for connections
CREATE POLICY "Users can view their own connections" 
ON public.connections 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = target_user_id);

CREATE POLICY "Users can create connections to others" 
ON public.connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections" 
ON public.connections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policy to allow participants to add each other to conversations
CREATE POLICY "Connected users can add each other to conversations" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.connections c 
    WHERE (c.user_id = auth.uid() AND c.target_user_id = conversation_participants.user_id)
    OR (c.target_user_id = auth.uid() AND c.user_id = conversation_participants.user_id)
  )
);