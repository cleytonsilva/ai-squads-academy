-- =====================================================
-- SCHEMA SQL DDL REFATORADO - AI SQUADS ACADEMY
-- Aplicando melhorias do arquivo melhoriasbanco.xml
-- =====================================================

-- =====================================================
-- 1. CRIAÇÃO DE TIPOS ENUM
-- =====================================================

-- Tipo ENUM para status de cursos
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');

-- Tipo ENUM para status de progresso/matrícula
CREATE TYPE enrollment_status AS ENUM ('in_progress', 'completed', 'dropped');

-- Tipo ENUM para tipos de lição
CREATE TYPE lesson_type AS ENUM ('video', 'text', 'quiz', 'assignment', 'interactive');

-- Tipo ENUM para níveis de dificuldade
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- Tipo ENUM para status de jobs de geração
CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Tipo ENUM para status de tracks
CREATE TYPE track_status AS ENUM ('draft', 'published', 'archived');

-- Tipo ENUM para status de missões
CREATE TYPE mission_status AS ENUM ('not_started', 'in_progress', 'completed');

-- =====================================================
-- 2. FUNÇÃO TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. TABELAS DE LOOKUP (NORMALIZAÇÃO)
-- =====================================================

-- Tabela de categorias
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(100) NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_name_unique UNIQUE (name)
);

-- Tabela de tags
CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(50) NOT NULL,
  color character varying(7), -- Para cores hex
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tags_pkey PRIMARY KEY (id),
  CONSTRAINT tags_name_unique UNIQUE (name)
);

-- =====================================================
-- 4. TABELAS PRINCIPAIS
-- =====================================================

-- Tabela profiles (mantida como referência central)
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email character varying(255),
  full_name character varying(255),
  avatar_url character varying(500),
  bio text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela courses (com melhorias aplicadas)
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying(255) NOT NULL,
  description text,
  content text,
  cover_image_url character varying(500),
  difficulty difficulty_level DEFAULT 'beginner',
  duration_minutes integer DEFAULT 0,
  status course_status DEFAULT 'draft',
  is_public boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  price numeric(10,2) DEFAULT 0,
  category_id uuid,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT courses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- Tabela de junção course_tags (many-to-many)
CREATE TABLE public.course_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT course_tags_pkey PRIMARY KEY (id),
  CONSTRAINT course_tags_course_id_tag_id_unique UNIQUE (course_id, tag_id),
  CONSTRAINT course_tags_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE,
  CONSTRAINT course_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE
);

-- Tabela modules
CREATE TABLE public.modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  title character varying(255) NOT NULL,
  description text,
  content_jsonb jsonb,
  order_index integer DEFAULT 0,
  is_published boolean DEFAULT false,
  duration_minutes integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT modules_pkey PRIMARY KEY (id),
  CONSTRAINT modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE
);

-- Tabela lessons
CREATE TABLE public.lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL,
  title character varying(255) NOT NULL,
  content text,
  lesson_type lesson_type DEFAULT 'text',
  video_url character varying(500),
  duration_minutes integer DEFAULT 0,
  order_index integer DEFAULT 0,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lessons_pkey PRIMARY KEY (id),
  CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE
);

-- =====================================================
-- 5. TABELA UNIFICADA DE PROGRESSO (ENROLLMENTS)
-- =====================================================

-- Tabela enrollments unificada (substitui course_completions e user_progress)
CREATE TABLE public.enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  enrolled_at timestamp with time zone DEFAULT now(),
  progress numeric DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  last_accessed_at timestamp with time zone,
  status enrollment_status DEFAULT 'in_progress',
  completed_at timestamp with time zone,
  final_score numeric,
  time_spent_minutes integer DEFAULT 0,
  modules_completed integer DEFAULT 0,
  total_modules integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT enrollments_user_id_course_id_unique UNIQUE (user_id, course_id),
  CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE
);

-- =====================================================
-- 6. OUTRAS TABELAS PRINCIPAIS
-- =====================================================

-- Tabela tracks
CREATE TABLE public.tracks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying(255) NOT NULL,
  description text,
  cover_image_url character varying(500),
  status track_status DEFAULT 'draft',
  is_public boolean DEFAULT false,
  is_certifiable boolean DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tracks_pkey PRIMARY KEY (id),
  CONSTRAINT tracks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- Tabela track_courses (junção)
CREATE TABLE public.track_courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL,
  course_id uuid NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT track_courses_pkey PRIMARY KEY (id),
  CONSTRAINT track_courses_track_id_course_id_unique UNIQUE (track_id, course_id),
  CONSTRAINT track_courses_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE,
  CONSTRAINT track_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE
);

-- Tabela user_tracks
CREATE TABLE public.user_tracks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  track_id uuid NOT NULL,
  progress numeric DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status enrollment_status DEFAULT 'in_progress',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_tracks_pkey PRIMARY KEY (id),
  CONSTRAINT user_tracks_user_id_track_id_unique UNIQUE (user_id, track_id),
  CONSTRAINT user_tracks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT user_tracks_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE
);

-- Tabela quizzes
CREATE TABLE public.quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid,
  track_id uuid,
  title character varying(255) NOT NULL,
  description text,
  questions jsonb,
  passing_score integer DEFAULT 70,
  time_limit_minutes integer,
  max_attempts integer DEFAULT 3,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT quizzes_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE,
  CONSTRAINT quizzes_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE
);

-- Tabela quiz_attempts
CREATE TABLE public.quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  user_id uuid NOT NULL,
  score integer,
  answers jsonb,
  completed_at timestamp with time zone,
  time_taken_minutes integer,
  passed boolean DEFAULT false,
  attempt_number integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE,
  CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Tabela badges
CREATE TABLE public.badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(255) NOT NULL,
  description text,
  icon_url character varying(500),
  category_id uuid,
  requirements jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT badges_pkey PRIMARY KEY (id),
  CONSTRAINT badges_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);

-- Tabela user_badges
CREATE TABLE public.user_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL,
  course_id uuid,
  earned_at timestamp with time zone DEFAULT now(),
  awarded_at timestamp with time zone DEFAULT now(),
  source character varying(100),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_badges_pkey PRIMARY KEY (id),
  CONSTRAINT user_badges_user_id_badge_id_unique UNIQUE (user_id, badge_id),
  CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE,
  CONSTRAINT user_badges_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL
);

-- Tabela certificates
CREATE TABLE public.certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  certificate_url character varying(500),
  issued_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  verification_code character varying(100),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT certificates_pkey PRIMARY KEY (id),
  CONSTRAINT certificates_user_id_course_id_unique UNIQUE (user_id, course_id),
  CONSTRAINT certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT certificates_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE
);

-- Tabela missions
CREATE TABLE public.missions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying(255) NOT NULL,
  description text,
  requirements jsonb,
  rewards jsonb,
  difficulty difficulty_level DEFAULT 'beginner',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT missions_pkey PRIMARY KEY (id)
);

-- Tabela user_missions
CREATE TABLE public.user_missions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id uuid NOT NULL,
  status mission_status DEFAULT 'not_started',
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_missions_pkey PRIMARY KEY (id),
  CONSTRAINT user_missions_user_id_mission_id_unique UNIQUE (user_id, mission_id),
  CONSTRAINT user_missions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT user_missions_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.missions(id) ON DELETE CASCADE
);

-- Tabela generation_jobs
CREATE TABLE public.generation_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_type character varying(100) NOT NULL,
  status generation_status DEFAULT 'pending',
  input_data jsonb,
  output_data jsonb,
  error_message text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT generation_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT generation_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- 7. ÍNDICES DE PERFORMANCE
-- =====================================================

-- Índices para chaves estrangeiras
CREATE INDEX idx_courses_category_id ON public.courses(category_id);
CREATE INDEX idx_courses_created_by ON public.courses(created_by);
CREATE INDEX idx_course_tags_course_id ON public.course_tags(course_id);
CREATE INDEX idx_course_tags_tag_id ON public.course_tags(tag_id);
CREATE INDEX idx_modules_course_id ON public.modules(course_id);
CREATE INDEX idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX idx_tracks_created_by ON public.tracks(created_by);
CREATE INDEX idx_track_courses_track_id ON public.track_courses(track_id);
CREATE INDEX idx_track_courses_course_id ON public.track_courses(course_id);
CREATE INDEX idx_user_tracks_user_id ON public.user_tracks(user_id);
CREATE INDEX idx_user_tracks_track_id ON public.user_tracks(track_id);
CREATE INDEX idx_quizzes_course_id ON public.quizzes(course_id);
CREATE INDEX idx_quizzes_track_id ON public.quizzes(track_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX idx_badges_category_id ON public.badges(category_id);
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX idx_user_badges_course_id ON public.user_badges(course_id);
CREATE INDEX idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX idx_certificates_course_id ON public.certificates(course_id);
CREATE INDEX idx_user_missions_user_id ON public.user_missions(user_id);
CREATE INDEX idx_user_missions_mission_id ON public.user_missions(mission_id);
CREATE INDEX idx_generation_jobs_user_id ON public.generation_jobs(user_id);

-- Índices compostos para consultas frequentes
CREATE INDEX idx_enrollments_user_status ON public.enrollments(user_id, status);
CREATE INDEX idx_enrollments_course_status ON public.enrollments(course_id, status);
CREATE INDEX idx_courses_status_public ON public.courses(status, is_public);
CREATE INDEX idx_quiz_attempts_user_quiz ON public.quiz_attempts(user_id, quiz_id);

-- =====================================================
-- 8. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER set_timestamp_categories
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_tags
  BEFORE UPDATE ON public.tags
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_courses
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_modules
  BEFORE UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_lessons
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_enrollments
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_tracks
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_track_courses
  BEFORE UPDATE ON public.track_courses
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_user_tracks
  BEFORE UPDATE ON public.user_tracks
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_quizzes
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_quiz_attempts
  BEFORE UPDATE ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_badges
  BEFORE UPDATE ON public.badges
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_certificates
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_missions
  BEFORE UPDATE ON public.missions
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_user_missions
  BEFORE UPDATE ON public.user_missions
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_generation_jobs
  BEFORE UPDATE ON public.generation_jobs
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- =====================================================
-- 9. DADOS INICIAIS (SEEDS)
-- =====================================================

-- Categorias iniciais
INSERT INTO public.categories (name, description) VALUES
('Programação', 'Cursos relacionados a desenvolvimento de software'),
('Design', 'Cursos de design gráfico, UX/UI e criatividade'),
('Marketing', 'Cursos de marketing digital e estratégias de negócio'),
('Dados', 'Cursos de ciência de dados, análise e inteligência artificial'),
('Negócios', 'Cursos de empreendedorismo e gestão empresarial');

-- Tags iniciais
INSERT INTO public.tags (name, color) VALUES
('JavaScript', '#F7DF1E'),
('Python', '#3776AB'),
('React', '#61DAFB'),
('Node.js', '#339933'),
('SQL', '#4479A1'),
('Machine Learning', '#FF6F00'),
('UX/UI', '#FF5722'),
('Marketing Digital', '#4CAF50'),
('Iniciante', '#2196F3'),
('Avançado', '#F44336');

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- RESUMO DAS MELHORIAS APLICADAS:
-- ✅ 1. Unificação de tabelas de progresso (enrollments)
-- ✅ 2. Remoção de colunas redundantes em courses
-- ✅ 3. Padronização de chaves estrangeiras para profiles.id
-- ✅ 4. Adição de índices em todas as chaves estrangeiras
-- ✅ 5. Normalização de dados categóricos (categories, tags)
-- ✅ 6. Implementação de tipos ENUM
-- ✅ 7. Trigger automático para updated_at
-- ✅ 8. Estrutura otimizada e consistente
-- ✅ 9. Dados iniciais para categorias e tags