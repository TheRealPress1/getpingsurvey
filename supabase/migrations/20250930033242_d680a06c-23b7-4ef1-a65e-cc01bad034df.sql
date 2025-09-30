-- Clean up existing fake data and remove featured_work column
UPDATE profiles 
SET 
  featured_work = NULL,
  display_name = CASE 
    WHEN display_name = 'Vaness "Reece" Gardner' THEN 'Vaness Gardner'
    ELSE display_name
  END,
  skills = CASE 
    WHEN skills = ARRAY['Marketing', 'Problem Solving', 'AI', 'Product Design', 'Leadership', 'Communication', 'Creative Thinking', 'Project Management'] THEN NULL
    WHEN skills = ARRAY['networking', 'relationship building', 'collaboration'] THEN NULL
    ELSE skills
  END,
  interests = CASE 
    WHEN interests = ARRAY['Technology', 'Art', 'Music', 'Travel', 'Entrepreneurship', 'Fashion', 'Architecture', 'Innovation', 'Sports', 'Nature'] THEN NULL
    WHEN interests = ARRAY['professional development', 'cross-industry collaboration', 'learning new insights'] THEN NULL
    ELSE interests
  END
WHERE featured_work IS NOT NULL 
   OR display_name = 'Vaness "Reece" Gardner'
   OR skills = ARRAY['Marketing', 'Problem Solving', 'AI', 'Product Design', 'Leadership', 'Communication', 'Creative Thinking', 'Project Management']
   OR skills = ARRAY['networking', 'relationship building', 'collaboration']
   OR interests = ARRAY['Technology', 'Art', 'Music', 'Travel', 'Entrepreneurship', 'Fashion', 'Architecture', 'Innovation', 'Sports', 'Nature']
   OR interests = ARRAY['professional development', 'cross-industry collaboration', 'learning new insights'];