-- Create RPC functions for gamification logic to ensure atomicity and centralize logic.

-- 1. Function to update mission attempt state atomically
CREATE OR REPLACE FUNCTION public.update_mission_attempt_state(
    p_attempt_id uuid,
    p_xp_change integer,
    p_lives_change integer
)
RETURNS TABLE (
    new_xp_earned integer,
    new_lives_remaining integer,
    new_status mission_attempt_status
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_lives integer;
    final_xp integer;
    final_lives integer;
    final_status mission_attempt_status;
BEGIN
    -- Select current values and lock the row for this transaction
    SELECT xp_earned, lives_remaining, status
    INTO final_xp, current_lives, final_status
    FROM public.mission_attempts
    WHERE id = p_attempt_id
    FOR UPDATE;

    -- If the attempt is already completed or failed, do nothing.
    IF final_status IN ('completed', 'failed') THEN
        RETURN QUERY SELECT final_xp, current_lives, final_status;
        RETURN;
    END IF;

    -- Apply changes
    final_xp := final_xp + p_xp_change;
    final_lives := current_lives + p_lives_change;

    -- Determine the new status
    IF final_lives <= 0 THEN
        final_status := 'failed';
        final_lives := 0; -- Prevent lives from going below 0
    END IF;

    -- Update the record
    UPDATE public.mission_attempts
    SET
        xp_earned = final_xp,
        lives_remaining = final_lives,
        status = final_status,
        updated_at = now()
    WHERE id = p_attempt_id;

    -- Return the new state
    RETURN QUERY SELECT final_xp, final_lives, final_status;
END;
$$;

COMMENT ON FUNCTION public.update_mission_attempt_state IS 'Atomically updates XP and lives for a mission attempt and returns the new state.';


-- 2. Function to check mission prerequisites
CREATE OR REPLACE FUNCTION public.check_mission_prerequisites(
    p_user_id uuid,
    p_mission_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    -- This is a placeholder for the actual prerequisite logic.
    -- For now, we assume all missions are unlocked.
    -- In a real implementation, this would check for completion of other courses,
    -- modules, or prerequisite missions based on a requirements table.
    SELECT true;
$$;

COMMENT ON FUNCTION public.check_mission_prerequisites IS 'Checks if a user has met all prerequisites to start a given mission. Placeholder for now.';

-- Grant execute permissions to the authenticated role
GRANT EXECUTE ON FUNCTION public.update_mission_attempt_state(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_mission_prerequisites(uuid, uuid) TO authenticated;
