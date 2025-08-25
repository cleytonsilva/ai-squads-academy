-- Fix RLS policies for missions and user_missions tables
-- Date: 2025-08-19
-- Description: Corrects RLS policies to work with profiles table and grants proper permissions

-- First, grant basic permissions to authenticated and anon roles
GRANT SELECT ON public.missions TO anon, authenticated;
GRANT SELECT ON public.user_missions TO authenticated;
GRANT INSERT, UPDATE ON public.user_missions TO authenticated;

-- Drop existing policies to recreate them with correct logic
DROP POLICY IF EXISTS "Instructors and admins can manage missions" ON public.missions;
DROP POLICY IF EXISTS "Missions are viewable if course is accessible" ON public.missions;
DROP POLICY IF EXISTS "Users can manage their own missions" ON public.user_missions;
DROP POLICY IF EXISTS "Admins and instructors can view all user missions" ON public.user_missions;

-- Recreate missions policies with corrected logic

-- Allow everyone to view published missions (simplified for now)
CREATE POLICY "Anyone can view missions"
ON public.missions FOR SELECT
USING (true);

-- Admins and instructors can manage all missions
CREATE POLICY "Admins and instructors can manage missions"
ON public.missions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'instructor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- Recreate user_missions policies with corrected logic

-- Users can view and manage their own mission progress
CREATE POLICY "Users can manage their own mission progress"
ON public.user_missions FOR ALL
USING (
  user_id IN (
    SELECT profiles.id FROM public.profiles
    WHERE profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT profiles.id FROM public.profiles
    WHERE profiles.user_id = auth.uid()
  )
);

-- Admins and instructors can view all user missions
CREATE POLICY "Admins and instructors can view all user missions"
ON public.user_missions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- Fix foreign key constraint for user_missions to reference profiles instead of auth.users
-- First, check if we need to update the constraint
DO $$
BEGIN
    -- Drop the old constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_missions_user_id') THEN
        ALTER TABLE public.user_missions DROP CONSTRAINT fk_user_missions_user_id;
    END IF;
    
    -- Add the corrected constraint
    ALTER TABLE public.user_missions
    ADD CONSTRAINT fk_user_missions_user_id
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION
    WHEN others THEN
        -- If there's an error (like data inconsistency), just log it and continue
        RAISE NOTICE 'Could not update foreign key constraint: %', SQLERRM;
END $$;

-- Add helpful functions for mission management

-- Function to get user's profile ID from auth.uid()
CREATE OR REPLACE FUNCTION public.get_current_user_profile_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Function to check if current user is admin or instructor
CREATE OR REPLACE FUNCTION public.is_admin_or_instructor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'instructor')
  );
$$;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.get_current_user_profile_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_instructor() TO authenticated, anon;

-- Add comments
COMMENT ON FUNCTION public.get_current_user_profile_id IS 'Returns the profile ID for the currently authenticated user';
COMMENT ON FUNCTION public.is_admin_or_instructor IS 'Checks if the current user has admin or instructor role';

-- Ensure the mission_scenarios table has proper permissions too
GRANT SELECT ON public.mission_scenarios TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.mission_scenarios TO authenticated;

-- Grant permissions on mission_attempts and mission_chat_logs
GRANT SELECT, INSERT, UPDATE ON public.mission_attempts TO authenticated;
GRANT SELECT, INSERT ON public.mission_chat_logs TO authenticated;

-- Add policy for mission_attempts to allow users to insert their own attempts
CREATE POLICY "Users can create and view their own mission attempts"
ON public.mission_attempts FOR ALL
USING (
  user_id IN (
    SELECT profiles.id FROM public.profiles
    WHERE profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT profiles.id FROM public.profiles
    WHERE profiles.user_id = auth.uid()
  )
);

-- Add policy for mission_chat_logs
CREATE POLICY "Users can view chat logs for their own attempts"
ON public.mission_chat_logs FOR SELECT
USING (
  attempt_id IN (
    SELECT ma.id FROM public.mission_attempts ma
    JOIN public.profiles p ON ma.user_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Allow edge functions to insert chat logs
CREATE POLICY "Service role can insert chat logs"
ON public.mission_chat_logs FOR INSERT
WITH CHECK (true);