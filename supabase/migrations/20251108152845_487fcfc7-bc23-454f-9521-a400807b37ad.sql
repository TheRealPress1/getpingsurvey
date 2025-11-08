-- Add model_3d_url column to profiles table for storing user's 3D character model
ALTER TABLE profiles 
ADD COLUMN model_3d_url TEXT;