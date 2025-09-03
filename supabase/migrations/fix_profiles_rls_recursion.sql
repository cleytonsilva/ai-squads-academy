-- Fix infinite recursion in profiles RLS policies
-- Remove existing policies that cause recursion
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;

-- Create simple, non-recursive policies
-- Allow users to read their own profile using auth.uid()
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow users to update their own profile using auth.uid()
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (user_id = auth.uid());

-- Allow users to insert their own profile using auth.uid()
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to read basic profile info (for admin checks)
-- This avoids recursion by not checking the role in the profiles table
CREATE POLICY "Authenticated users can read profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: Admin-specific policies removed to avoid recursion
-- Admin access will be handled at the application level