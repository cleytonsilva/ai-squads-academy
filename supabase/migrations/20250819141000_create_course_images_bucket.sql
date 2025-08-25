-- Create course-images bucket
-- Note: Storage policies need to be configured via Supabase Dashboard

-- Create the course-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-images',
  'course-images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Note: Storage policies for the bucket need to be configured manually in Supabase Dashboard
-- Required policies:
-- 1. Public read access: bucket_id = 'course-images'
-- 2. Authenticated upload: bucket_id = 'course-images' AND auth.role() = 'authenticated'
-- 3. Service role full access: bucket_id = 'course-images' AND auth.jwt() ->> 'role' = 'service_role'