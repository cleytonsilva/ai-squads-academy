-- Clean orphaned data and fix foreign key relationships
-- This migration removes orphaned records and adds missing foreign key constraints

-- Clean orphaned records in user_progress
DELETE FROM public.user_progress 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Clean orphaned records in user_badges
DELETE FROM public.user_badges 
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM public.user_badges 
WHERE badge_id NOT IN (SELECT id FROM public.badges);

-- Clean orphaned records in quiz_attempts
DELETE FROM public.quiz_attempts 
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM public.quiz_attempts 
WHERE quiz_id NOT IN (SELECT id FROM public.quizzes);

-- Clean orphaned records in user_missions
DELETE FROM public.user_missions 
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM public.user_missions 
WHERE mission_id NOT IN (SELECT id FROM public.missions);

-- Clean orphaned records in certificates
DELETE FROM public.certificates 
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM public.certificates 
WHERE course_id NOT IN (SELECT id FROM public.courses);

-- Clean orphaned records in quizzes
DELETE FROM public.quizzes 
WHERE course_id NOT IN (SELECT id FROM public.courses);

-- Clean orphaned records in missions
DELETE FROM public.missions 
WHERE course_id NOT IN (SELECT id FROM public.courses);

-- Now add foreign key constraints safely

-- Add foreign key constraints to user_badges table
ALTER TABLE public.user_badges 
ADD CONSTRAINT fk_user_badges_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_badges 
ADD CONSTRAINT fk_user_badges_badge_id 
FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;

-- Add foreign key constraints to quiz_attempts
ALTER TABLE public.quiz_attempts 
ADD CONSTRAINT fk_quiz_attempts_quiz_id 
FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_attempts 
ADD CONSTRAINT fk_quiz_attempts_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraints to quizzes
ALTER TABLE public.quizzes 
ADD CONSTRAINT fk_quizzes_course_id 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- Add foreign key constraints to missions
ALTER TABLE public.missions 
ADD CONSTRAINT fk_missions_course_id 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- Add foreign key constraints to user_missions
ALTER TABLE public.user_missions 
ADD CONSTRAINT fk_user_missions_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_missions 
ADD CONSTRAINT fk_user_missions_mission_id 
FOREIGN KEY (mission_id) REFERENCES public.missions(id) ON DELETE CASCADE;

-- Add foreign key constraints to certificates
ALTER TABLE public.certificates 
ADD CONSTRAINT fk_certificates_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.certificates 
ADD CONSTRAINT fk_certificates_course_id 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- Create badge_challenges table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.badge_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    badge_id UUID NOT NULL,
    challenge_type VARCHAR(50) NOT NULL,
    challenge_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for badge_challenges
ALTER TABLE public.badge_challenges 
ADD CONSTRAINT fk_badge_challenges_badge_id 
FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;

-- Add foreign keys for user_progress
ALTER TABLE public.user_progress 
ADD CONSTRAINT fk_user_progress_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.badge_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for badge_challenges
CREATE POLICY "Users can view badge challenges" ON public.badge_challenges
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage badge challenges" ON public.badge_challenges
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for user_progress
CREATE POLICY "Users can view own progress" ON public.user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert progress" ON public.user_progress
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all progress" ON public.user_progress
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_badge_challenges_updated_at') THEN
        CREATE TRIGGER update_badge_challenges_updated_at
            BEFORE UPDATE ON public.badge_challenges
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_progress_updated_at') THEN
        CREATE TRIGGER update_user_progress_updated_at
            BEFORE UPDATE ON public.user_progress
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;