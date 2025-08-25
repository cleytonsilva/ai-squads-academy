-- Tracks feature: tables and policies (fixed for Postgres compatibility)
-- 1) Create tracks table
CREATE TABLE IF NOT EXISTS public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_certifiable BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Manage by admins/instructors
DO $$ BEGIN
  CREATE POLICY "Admins and instructors can manage tracks"
  ON public.tracks
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Owners (students) can manage their own tracks
DO $$ BEGIN
  CREATE POLICY "Users can manage their own tracks"
  ON public.tracks
  FOR ALL
  USING (created_by IN (
    SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()
  ))
  WITH CHECK (created_by IN (
    SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- View tracks if public or owner
DO $$ BEGIN
  CREATE POLICY "Tracks are viewable if public or owner"
  ON public.tracks
  FOR SELECT
  USING (
    is_public = true OR
    created_by IN (
      SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_tracks_updated_at ON public.tracks;
CREATE TRIGGER update_tracks_updated_at
BEFORE UPDATE ON public.tracks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Create track_courses
CREATE TABLE IF NOT EXISTS public.track_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.track_courses ENABLE ROW LEVEL SECURITY;

-- Manage if can manage parent track
DO $$ BEGIN
  CREATE POLICY "Manage track_courses if can manage parent track"
  ON public.track_courses
  FOR ALL
  USING (track_id IN (
    SELECT t.id FROM public.tracks t
    WHERE t.created_by IN (
      SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()
        AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
    )
  ))
  WITH CHECK (track_id IN (
    SELECT t.id FROM public.tracks t
    WHERE t.created_by IN (
      SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()
        AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
    )
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- View if parent track viewable
DO $$ BEGIN
  CREATE POLICY "View track_courses if parent track viewable"
  ON public.track_courses
  FOR SELECT
  USING (track_id IN (
    SELECT t.id FROM public.tracks t
    WHERE t.is_public = true
       OR t.created_by IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid())
       OR EXISTS (
          SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()
            AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
       )
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger
DROP TRIGGER IF EXISTS update_track_courses_updated_at ON public.track_courses;
CREATE TRIGGER update_track_courses_updated_at
BEFORE UPDATE ON public.track_courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Create user_tracks
CREATE TABLE IF NOT EXISTS public.user_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress',
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id)
);

ALTER TABLE public.user_tracks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage their own user_tracks"
  ON public.user_tracks
  FOR ALL
  USING (user_id IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins/instructors can view user_tracks"
  ON public.user_tracks
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger
DROP TRIGGER IF EXISTS update_user_tracks_updated_at ON public.user_tracks;
CREATE TRIGGER update_user_tracks_updated_at
BEFORE UPDATE ON public.user_tracks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_track_courses_track_id ON public.track_courses(track_id);
CREATE INDEX IF NOT EXISTS idx_track_courses_course_id ON public.track_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_user_tracks_user_id ON public.user_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tracks_track_id ON public.user_tracks(track_id);

-- 4) Extend quizzes and missions to allow track-level items
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE;

-- Extra visibility policies for track-linked entities
DO $$ BEGIN
  CREATE POLICY "Quizzes are viewable if track is accessible"
  ON public.quizzes
  FOR SELECT
  USING (
    track_id IS NOT NULL AND track_id IN (
      SELECT t.id FROM public.tracks t
      WHERE t.is_public = true
         OR t.created_by IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid())
         OR EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()
              AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
         )
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Missions are viewable if track is accessible"
  ON public.missions
  FOR SELECT
  USING (
    track_id IS NOT NULL AND track_id IN (
      SELECT t.id FROM public.tracks t
      WHERE t.is_public = true
         OR t.created_by IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid())
         OR EXISTS (
            SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid()
              AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
         )
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;