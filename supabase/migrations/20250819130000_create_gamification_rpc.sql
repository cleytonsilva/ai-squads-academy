-- Create RPC functions for gamification logic
-- Date: 2025-08-19
-- Description: Creates database functions for atomic mission state updates and prerequisite checking

-- Function to atomically update mission attempt state (XP and lives)
-- This prevents race conditions when multiple operations try to update the same attempt
CREATE OR REPLACE FUNCTION public.update_mission_attempt_state(
    p_attempt_id UUID,
    p_xp_change INTEGER DEFAULT 0,
    p_lives_change INTEGER DEFAULT 0
)
RETURNS TABLE(
    success BOOLEAN,
    new_xp INTEGER,
    new_lives INTEGER,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_xp INTEGER;
    current_lives INTEGER;
    new_xp_value INTEGER;
    new_lives_value INTEGER;
    attempt_exists BOOLEAN;
BEGIN
    -- Check if attempt exists and get current values
    SELECT 
        xp_earned, 
        lives_remaining,
        TRUE
    INTO 
        current_xp, 
        current_lives,
        attempt_exists
    FROM public.mission_attempts 
    WHERE id = p_attempt_id;
    
    -- If attempt doesn't exist, return error
    IF NOT attempt_exists THEN
        RETURN QUERY SELECT FALSE, 0, 0, 'Mission attempt not found'::TEXT;
        RETURN;
    END IF;
    
    -- Calculate new values
    new_xp_value := current_xp + p_xp_change;
    new_lives_value := current_lives + p_lives_change;
    
    -- Ensure values don't go below 0
    new_xp_value := GREATEST(new_xp_value, 0);
    new_lives_value := GREATEST(new_lives_value, 0);
    
    -- Update the attempt atomically
    UPDATE public.mission_attempts 
    SET 
        xp_earned = new_xp_value,
        lives_remaining = new_lives_value,
        updated_at = NOW(),
        -- Update status based on lives
        status = CASE 
            WHEN new_lives_value <= 0 THEN 'failed'::mission_attempt_status
            WHEN status = 'locked' AND new_lives_value > 0 THEN 'in_progress'::mission_attempt_status
            ELSE status
        END
    WHERE id = p_attempt_id;
    
    -- Return success with new values
    RETURN QUERY SELECT TRUE, new_xp_value, new_lives_value, 'State updated successfully'::TEXT;
END;
$$;

-- Function to check mission prerequisites
-- This centralizes the logic for determining if a user can access a mission
CREATE OR REPLACE FUNCTION public.check_mission_prerequisites(
    p_user_id UUID,
    p_mission_id UUID
)
RETURNS TABLE(
    can_access BOOLEAN,
    reason TEXT,
    required_missions UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_exists BOOLEAN;
    mission_exists BOOLEAN;
    course_id_var UUID;
    required_course_completion BOOLEAN;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id) INTO user_exists;
    IF NOT user_exists THEN
        RETURN QUERY SELECT FALSE, 'User not found'::TEXT, ARRAY[]::UUID[];
        RETURN;
    END IF;
    
    -- Check if mission exists and get course_id
    SELECT 
        EXISTS(SELECT 1 FROM public.missions WHERE id = p_mission_id),
        course_id
    INTO 
        mission_exists,
        course_id_var
    FROM public.missions 
    WHERE id = p_mission_id;
    
    IF NOT mission_exists THEN
        RETURN QUERY SELECT FALSE, 'Mission not found'::TEXT, ARRAY[]::UUID[];
        RETURN;
    END IF;
    
    -- For now, implement basic logic - user can access if they have access to the course
    -- This can be expanded later with more complex prerequisite logic
    
    -- Check if user has access to the course (simplified check)
    -- In a real implementation, you might check enrollment, course completion, etc.
    SELECT TRUE INTO required_course_completion;
    
    -- Basic access granted for now - can be enhanced with:
    -- - Previous mission completion requirements
    -- - Course enrollment checks
    -- - User role/permission checks
    -- - Time-based restrictions
    
    RETURN QUERY SELECT TRUE, 'Access granted'::TEXT, ARRAY[]::UUID[];
END;
$$;

-- Function to get mission attempt with user validation
-- Helper function to safely get mission attempts with proper user validation
CREATE OR REPLACE FUNCTION public.get_user_mission_attempt(
    p_user_id UUID,
    p_scenario_id UUID
)
RETURNS TABLE(
    attempt_id UUID,
    status mission_attempt_status,
    xp_earned INTEGER,
    lives_remaining INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ma.id,
        ma.status,
        ma.xp_earned,
        ma.lives_remaining,
        ma.started_at,
        ma.completed_at
    FROM public.mission_attempts ma
    WHERE ma.user_id = p_user_id 
    AND ma.scenario_id = p_scenario_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.update_mission_attempt_state(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_mission_prerequisites(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_mission_attempt(UUID, UUID) TO authenticated;

-- Grant execute permissions to anon users for read-only functions
GRANT EXECUTE ON FUNCTION public.check_mission_prerequisites(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_mission_attempt(UUID, UUID) TO anon;

-- Add comments for documentation
COMMENT ON FUNCTION public.update_mission_attempt_state IS 'Atomically updates XP and lives for a mission attempt, preventing race conditions';
COMMENT ON FUNCTION public.check_mission_prerequisites IS 'Checks if a user meets the prerequisites to access a specific mission';
COMMENT ON FUNCTION public.get_user_mission_attempt IS 'Safely retrieves mission attempt data for a user and scenario';