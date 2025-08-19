-- Align database with requested blueprint while respecting existing schema and RLS
-- 1) Add status column to courses (keep existing instructor_id as creator reference)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='courses' AND column_name='status'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN status TEXT NOT NULL DEFAULT 'draft';
  END IF;
END $$;

-- 2) Add metadata to modules
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='modules' AND column_name='metadata'
  ) THEN
    ALTER TABLE public.modules ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- 3) Add profile_data to profiles (xp and role already exist)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='profile_data'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN profile_data JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 4) Ensure updated_at triggers are present for automatic timestamp maintenance
-- Drop/create to avoid duplicates safely
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_modules_updated_at ON public.modules;
CREATE TRIGGER update_modules_updated_at
BEFORE UPDATE ON public.modules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON public.user_progress;
CREATE TRIGGER update_user_progress_updated_at
BEFORE UPDATE ON public.user_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
