-- =====================================================
-- SCHEMA SQL DDL REFATORADO - AI SQUADS ACADEMY
-- Aplicando melhorias do arquivo melhoriasbanco.xml
-- Data: 2025-01-24
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
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(100) NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_name_unique UNIQUE (name)
);

-- Tabela de tags
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(50) NOT NULL,
  color character varying(7), -- Para cores hex
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tags_pkey PRIMARY KEY (id),
  CONSTRAINT tags_name_unique UNIQUE (name)
);

-- =====================================================
-- 4. ADIÇÃO DE COLUNAS EM TABELAS EXISTENTES
-- =====================================================

-- Adicionar colunas em courses se não existirem
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS category_id uuid,
ADD COLUMN IF NOT EXISTS difficulty difficulty_level DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS status course_status DEFAULT 'draft';

-- Adicionar colunas em lessons se não existirem
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS lesson_type lesson_type DEFAULT 'text';

-- =====================================================
-- 5. TABELA DE JUNÇÃO COURSE_TAGS
-- =====================================================

-- Tabela de junção course_tags (many-to-many)
CREATE TABLE IF NOT EXISTS public.course_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT course_tags_pkey PRIMARY KEY (id),
  CONSTRAINT course_tags_course_id_tag_id_unique UNIQUE (course_id, tag_id),
  CONSTRAINT course_tags_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE,
  CONSTRAINT course_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE
);

-- =====================================================
-- 6. TABELAS DE TRACKS
-- =====================================================

-- Tabela tracks
CREATE TABLE IF NOT EXISTS public.tracks (
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
CREATE TABLE IF NOT EXISTS public.track_courses (
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
CREATE TABLE IF NOT EXISTS public.user_tracks (
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

-- =====================================================
-- 7. MELHORIAS EM TABELAS EXISTENTES
-- =====================================================

-- Adicionar colunas em enrollments se não existirem
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS status enrollment_status DEFAULT 'in_progress',
ADD COLUMN IF NOT EXISTS final_score numeric,
ADD COLUMN IF NOT EXISTS time_spent_minutes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS modules_completed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_modules integer DEFAULT 0;

-- Adicionar colunas em generation_jobs se não existirem
ALTER TABLE public.generation_jobs 
ADD COLUMN IF NOT EXISTS status generation_status DEFAULT 'pending';

-- =====================================================
-- 8. ÍNDICES DE PERFORMANCE
-- =====================================================

-- Índices para chaves estrangeiras (criar apenas se não existirem)
CREATE INDEX IF NOT EXISTS idx_courses_category_id ON public.courses(category_id);
CREATE INDEX IF NOT EXISTS idx_course_tags_course_id ON public.course_tags(course_id);
CREATE INDEX IF NOT EXISTS idx_course_tags_tag_id ON public.course_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tracks_created_by ON public.tracks(created_by);
CREATE INDEX IF NOT EXISTS idx_track_courses_track_id ON public.track_courses(track_id);
CREATE INDEX IF NOT EXISTS idx_track_courses_course_id ON public.track_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_user_tracks_user_id ON public.user_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tracks_track_id ON public.user_tracks(track_id);

-- Índices compostos para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON public.enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status ON public.enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_courses_status_published ON public.courses(status, is_published);

-- =====================================================
-- 9. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Aplicar trigger em tabelas novas
DROP TRIGGER IF EXISTS set_timestamp_categories ON public.categories;
CREATE TRIGGER set_timestamp_categories
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_tags ON public.tags;
CREATE TRIGGER set_timestamp_tags
  BEFORE UPDATE ON public.tags
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_tracks ON public.tracks;
CREATE TRIGGER set_timestamp_tracks
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_track_courses ON public.track_courses;
CREATE TRIGGER set_timestamp_track_courses
  BEFORE UPDATE ON public.track_courses
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_user_tracks ON public.user_tracks;
CREATE TRIGGER set_timestamp_user_tracks
  BEFORE UPDATE ON public.user_tracks
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- =====================================================
-- 10. ADIÇÃO DE CHAVES ESTRANGEIRAS
-- =====================================================

-- Adicionar FK para category_id em courses se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'courses_category_id_fkey'
    ) THEN
        ALTER TABLE public.courses 
        ADD CONSTRAINT courses_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES public.categories(id);
    END IF;
END $$;

-- =====================================================
-- 11. DADOS INICIAIS (SEEDS)
-- =====================================================

-- Categorias iniciais (inserir apenas se não existirem)
INSERT INTO public.categories (name, description) 
SELECT * FROM (
  VALUES 
    ('Programação', 'Cursos relacionados a desenvolvimento de software'),
    ('Design', 'Cursos de design gráfico, UX/UI e criatividade'),
    ('Marketing', 'Cursos de marketing digital e estratégias de negócio'),
    ('Dados', 'Cursos de ciência de dados, análise e inteligência artificial'),
    ('Negócios', 'Cursos de empreendedorismo e gestão empresarial')
) AS v(name, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE c.name = v.name
);

-- Tags iniciais (inserir apenas se não existirem)
INSERT INTO public.tags (name, color) 
SELECT * FROM (
  VALUES 
    ('JavaScript', '#F7DF1E'),
    ('Python', '#3776AB'),
    ('React', '#61DAFB'),
    ('Node.js', '#339933'),
    ('SQL', '#4479A1'),
    ('Machine Learning', '#FF6F00'),
    ('UX/UI', '#FF5722'),
    ('Marketing Digital', '#4CAF50'),
    ('Iniciante', '#2196F3'),
    ('Avançado', '#F44336')
) AS v(name, color)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tags t WHERE t.name = v.name
);

-- =====================================================
-- 12. PERMISSÕES PARA ANON E AUTHENTICATED
-- =====================================================

-- Conceder permissões para as novas tabelas
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.tags TO anon, authenticated;
GRANT ALL ON public.course_tags TO authenticated;
GRANT SELECT ON public.course_tags TO anon;
GRANT ALL ON public.tracks TO authenticated;
GRANT SELECT ON public.tracks TO anon;
GRANT ALL ON public.track_courses TO authenticated;
GRANT SELECT ON public.track_courses TO anon;
GRANT ALL ON public.user_tracks TO authenticated;

-- =====================================================
-- FIM DO SCRIPT DE MIGRAÇÃO
-- =====================================================

-- RESUMO DAS MELHORIAS APLICADAS:
-- ✅ 1. Criação de tipos ENUM para padronização
-- ✅ 2. Função trigger para updated_at automático
-- ✅ 3. Tabelas de lookup (categories, tags)
-- ✅ 4. Melhorias em tabelas existentes (enrollments, courses, etc.)
-- ✅ 5. Padronização de chaves estrangeiras
-- ✅ 6. Índices de performance
-- ✅ 7. Triggers automáticos
-- ✅ 8. Dados iniciais para categorias e tags
-- ✅ 9. Permissões adequadas para anon e authenticated
-- ✅ 10. Compatibilidade com schema existente