-- Fix RLS policies for missions and user_missions tables

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view missions" ON missions;
DROP POLICY IF EXISTS "Users can view their mission progress" ON user_missions;
DROP POLICY IF EXISTS "Users can update their mission progress" ON user_missions;
DROP POLICY IF EXISTS "Users can insert their mission progress" ON user_missions;

-- Create comprehensive RLS policies for missions table
-- Allow public read access to missions (for course browsing)
CREATE POLICY "Public can view available missions" ON missions
FOR SELECT
USING (true);

-- Allow authenticated users to view all missions
CREATE POLICY "Authenticated users can view missions" ON missions
FOR SELECT
TO authenticated
USING (true);

-- Allow admins and instructors to manage missions
CREATE POLICY "Admins and instructors can manage missions" ON missions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- Create comprehensive RLS policies for user_missions table
-- Users can view their own mission progress
CREATE POLICY "Users can view their own mission progress" ON user_missions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own mission progress
CREATE POLICY "Users can insert their own mission progress" ON user_missions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own mission progress
CREATE POLICY "Users can update their own mission progress" ON user_missions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can view all user mission progress
CREATE POLICY "Admins can view all user missions" ON user_missions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Admins can manage all user mission progress
CREATE POLICY "Admins can manage all user missions" ON user_missions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Grant necessary permissions to anon and authenticated roles
GRANT SELECT ON missions TO anon;
GRANT SELECT ON missions TO authenticated;
GRANT ALL ON missions TO service_role;

GRANT SELECT, INSERT, UPDATE ON user_missions TO authenticated;
GRANT ALL ON user_missions TO service_role;

-- Ensure RLS is enabled
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;