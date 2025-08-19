-- Create the database schema for the new RPG Mission System

-- 1. Create ENUM types for status fields to ensure data consistency.

-- Enum for the status of a mission attempt
DO $$ BEGIN
    CREATE TYPE mission_attempt_status AS ENUM ('in_progress', 'completed', 'failed', 'locked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum for the role in a chat message (user or AI assistant)
DO $$ BEGIN
    CREATE TYPE mission_chat_role AS ENUM ('user', 'assistant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- 2. Create the tables for the RPG Mission System.

-- Table to store the main content and configuration of a mission scenario.
CREATE TABLE IF NOT EXISTS public.mission_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    initial_scenario TEXT NOT NULL,
    ai_system_prompt TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.mission_scenarios IS 'Stores the core content and AI configuration for each interactive mission.';

-- Table to track each user''s progress through a mission scenario.
CREATE TABLE IF NOT EXISTS public.mission_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES public.mission_scenarios(id) ON DELETE CASCADE,
    status mission_attempt_status NOT NULL DEFAULT 'locked',
    xp_earned INTEGER NOT NULL DEFAULT 0,
    lives_remaining INTEGER NOT NULL DEFAULT 7,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, scenario_id) -- A user can only have one attempt per scenario
);
COMMENT ON TABLE public.mission_attempts IS 'Tracks a user''s progress, score, and status for a specific mission scenario.';

-- Table to store the history of dialogues for each mission attempt.
CREATE TABLE IF NOT EXISTS public.mission_chat_logs (
    id BIGSERIAL PRIMARY KEY,
    attempt_id UUID NOT NULL REFERENCES public.mission_attempts(id) ON DELETE CASCADE,
    role mission_chat_role NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.mission_chat_logs IS 'Logs the back-and-forth dialogue between the user and the AI during a mission attempt.';


-- 3. Add RLS (Row-Level Security) policies to protect the data.

-- mission_scenarios
ALTER TABLE public.mission_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all mission scenarios" ON public.mission_scenarios FOR SELECT USING (true);
CREATE POLICY "Admins can create mission scenarios" ON public.mission_scenarios FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Admins can update mission scenarios" ON public.mission_scenarios FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Admins can delete mission scenarios" ON public.mission_scenarios FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- mission_attempts
ALTER TABLE public.mission_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own mission attempts" ON public.mission_attempts FOR SELECT USING (
    (SELECT id FROM public.profiles WHERE user_id = auth.uid()) = user_id
);
CREATE POLICY "Users can create their own mission attempts" ON public.mission_attempts FOR INSERT WITH CHECK (
    (SELECT id FROM public.profiles WHERE user_id = auth.uid()) = user_id
);
-- The backend Edge Function will handle updates, so we don't grant direct update access to users.

-- mission_chat_logs
ALTER TABLE public.mission_chat_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view chat logs for their own attempts" ON public.mission_chat_logs FOR SELECT USING (
    attempt_id IN (SELECT id FROM public.mission_attempts WHERE (SELECT id FROM public.profiles WHERE user_id = auth.uid()) = user_id)
);
-- The backend Edge Function will handle inserts.


-- 4. Create triggers to automatically update the `updated_at` timestamp.

DROP TRIGGER IF EXISTS on_mission_scenarios_update ON public.mission_scenarios;
CREATE TRIGGER on_mission_scenarios_update
    BEFORE UPDATE ON public.mission_scenarios
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS on_mission_attempts_update ON public.mission_attempts;
CREATE TRIGGER on_mission_attempts_update
    BEFORE UPDATE ON public.mission_attempts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
