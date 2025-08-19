-- Stage 1 schema additions for AI course generation, quizzes, missions, badges, certificates, and background jobs

-- Quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  module_id uuid,
  title text NOT NULL,
  description text,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  user_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  feedback jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_passed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_quiz_attempts_updated_at
BEFORE UPDATE ON public.quiz_attempts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Missions table (course/module-linked practical tasks)
CREATE TABLE IF NOT EXISTS public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  module_id uuid,
  title text NOT NULL,
  description text,
  points integer NOT NULL DEFAULT 50,
  order_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available',
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_missions_updated_at
BEFORE UPDATE ON public.missions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User missions (progress per user)
CREATE TABLE IF NOT EXISTS public.user_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'available',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_id)
);
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_user_missions_updated_at
BEFORE UPDATE ON public.user_missions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Badges catalog
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE,
  name text NOT NULL,
  description text,
  image_url text,
  style jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_badges_updated_at
BEFORE UPDATE ON public.badges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User badges linking
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Certificates per course
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  certificate_number text UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_certificates_updated_at
BEFORE UPDATE ON public.certificates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Background generation jobs table
CREATE TABLE IF NOT EXISTS public.generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  input jsonb,
  output jsonb,
  error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_generation_jobs_updated_at
BEFORE UPDATE ON public.generation_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Quizzes policies
CREATE POLICY "Instructors and admins can manage quizzes"
ON public.quizzes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  )
);

CREATE POLICY "Quizzes are viewable if course is accessible"
ON public.quizzes FOR SELECT
USING (
  course_id IN (
    SELECT courses.id FROM courses
    WHERE courses.is_published = true
       OR courses.instructor_id IN (
         SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
       )
  )
);

-- Quiz attempts policies
CREATE POLICY "Users can insert their own quiz attempts"
ON public.quiz_attempts FOR INSERT
WITH CHECK (
  user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Users can view their own quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (
  user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Users can update their own quiz attempts"
ON public.quiz_attempts FOR UPDATE
USING (
  user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Admins and instructors can view all quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  )
);

-- Missions policies
CREATE POLICY "Instructors and admins can manage missions"
ON public.missions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  )
);

CREATE POLICY "Missions are viewable if course is accessible"
ON public.missions FOR SELECT
USING (
  course_id IN (
    SELECT courses.id FROM courses
    WHERE courses.is_published = true
       OR courses.instructor_id IN (
         SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
       )
  )
);

-- User missions policies
CREATE POLICY "Users can manage their own missions"
ON public.user_missions FOR ALL
USING (
  user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
)
WITH CHECK (
  user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Admins and instructors can view all user missions"
ON public.user_missions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  )
);

-- Badges policies
CREATE POLICY "Badges are viewable by everyone"
ON public.badges FOR SELECT USING (true);

CREATE POLICY "Instructors and admins can manage badges"
ON public.badges FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  )
);

-- User badges policies
CREATE POLICY "Users can view their own badges"
ON public.user_badges FOR SELECT
USING (
  user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Users can insert their own badges"
ON public.user_badges FOR INSERT
WITH CHECK (
  user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Admins and instructors can view all user badges"
ON public.user_badges FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  )
);

-- Certificates policies
CREATE POLICY "Users can view their own certificates"
ON public.certificates FOR SELECT
USING (
  user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Users can insert their own certificates"
ON public.certificates FOR INSERT
WITH CHECK (
  user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Admins and instructors can view all certificates"
ON public.certificates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  )
);

-- Generation jobs policies
CREATE POLICY "Users can insert their own generation jobs"
ON public.generation_jobs FOR INSERT
WITH CHECK (
  created_by IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Users can view their own generation jobs"
ON public.generation_jobs FOR SELECT
USING (
  created_by IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Admins and instructors can view all generation jobs"
ON public.generation_jobs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  )
);
