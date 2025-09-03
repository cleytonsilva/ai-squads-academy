-- =====================================================
-- SCRIPT DE REFATORAÇÃO DO SCHEMA - AI SQUADS ACADEMY
-- =====================================================
-- Data: 2025-01-24
-- Objetivo: Aplicar refatorações pendentes da revisão anterior
-- 
-- MODIFICAÇÕES:
-- 1. Remoção de tabelas: course_completions, user_progress
-- 2. Remoção de colunas da tabela courses
-- 3. Padronização de FKs para public.profiles(id)
-- 4. Padronização de nomes de constraints FK
-- 5. Adição de constraints de unicidade
-- =====================================================

-- =====================================================
-- 1. REMOÇÃO DE TABELAS
-- =====================================================

-- Remover triggers relacionados às tabelas
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON public.user_progress;
DROP TRIGGER IF EXISTS trigger_user_progress_completion ON public.user_progress;
DROP TRIGGER IF EXISTS trigger_course_completion_check ON public.course_completions;

-- Remover políticas RLS
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can view their own completions" ON public.course_completions;
DROP POLICY IF EXISTS "Users can insert their own completions" ON public.course_completions;

-- Remover índices
DROP INDEX IF EXISTS idx_user_progress_user_course;
DROP INDEX IF EXISTS idx_user_progress_completion;
DROP INDEX IF EXISTS idx_course_completions_user_course;
DROP INDEX IF EXISTS idx_course_completions_completion_date;

-- Remover as tabelas
DROP TABLE IF EXISTS public.course_completions CASCADE;
DROP TABLE IF EXISTS public.user_progress CASCADE;

-- =====================================================
-- 2. MODIFICAÇÕES NA TABELA COURSES
-- =====================================================

-- Remover colunas da tabela courses (apenas as que existem)
ALTER TABLE public.courses DROP COLUMN IF EXISTS level;
ALTER TABLE public.courses DROP COLUMN IF EXISTS difficulty_level;
ALTER TABLE public.courses DROP COLUMN IF EXISTS duration_hours;
ALTER TABLE public.courses DROP COLUMN IF EXISTS estimated_duration;
ALTER TABLE public.courses DROP COLUMN IF EXISTS category;
ALTER TABLE public.courses DROP COLUMN IF EXISTS tags;

-- =====================================================
-- 3. PADRONIZAÇÃO DE CHAVES ESTRANGEIRAS
-- =====================================================

-- Alterar FKs de auth.users(id) para public.profiles(id)
-- Nota: Mantendo profiles referenciando auth.users(id)
-- Nota: mission_attempts e user_tracks já referenciam profiles(id)

-- Tabela enrollments
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_user_id_fkey;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Tabela user_badges
ALTER TABLE public.user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey;
ALTER TABLE public.user_badges ADD CONSTRAINT user_badges_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Tabela certificates
ALTER TABLE public.certificates DROP CONSTRAINT IF EXISTS certificates_user_id_fkey;
ALTER TABLE public.certificates ADD CONSTRAINT certificates_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Tabela user_missions
ALTER TABLE public.user_missions DROP CONSTRAINT IF EXISTS fk_user_missions_user_id;
ALTER TABLE public.user_missions ADD CONSTRAINT user_missions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Tabela user_activities
ALTER TABLE public.user_activities DROP CONSTRAINT IF EXISTS user_activities_user_id_fkey;
ALTER TABLE public.user_activities ADD CONSTRAINT user_activities_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Tabela user_assessment_attempts
ALTER TABLE public.user_assessment_attempts DROP CONSTRAINT IF EXISTS user_assessment_attempts_user_id_fkey;
ALTER TABLE public.user_assessment_attempts ADD CONSTRAINT user_assessment_attempts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Tabela user_achievements
ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_id_fkey;
ALTER TABLE public.user_achievements ADD CONSTRAINT user_achievements_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =====================================================
-- 4. PADRONIZAÇÃO DE NOMES DE CONSTRAINTS FK
-- =====================================================

-- Renomear constraints que começam com fk_ para o padrão tabela_origem_coluna_fkey

-- user_missions
ALTER TABLE public.user_missions DROP CONSTRAINT IF EXISTS fk_user_missions_mission_id;
ALTER TABLE public.user_missions ADD CONSTRAINT user_missions_mission_id_fkey 
    FOREIGN KEY (mission_id) REFERENCES public.missions(id) ON DELETE CASCADE;

-- =====================================================
-- 5. ADIÇÃO DE CONSTRAINTS DE UNICIDADE
-- =====================================================

-- Constraint de unicidade para enrollments
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_user_course_unique;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_user_course_unique 
    UNIQUE (user_id, course_id);

-- Constraint de unicidade para user_badges
ALTER TABLE public.user_badges DROP CONSTRAINT IF EXISTS user_badges_user_badge_unique;
ALTER TABLE public.user_badges ADD CONSTRAINT user_badges_user_badge_unique 
    UNIQUE (user_id, badge_id);

-- Constraint de unicidade para user_achievements
ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_achievement_unique;
ALTER TABLE public.user_achievements ADD CONSTRAINT user_achievements_user_achievement_unique 
    UNIQUE (user_id, achievement_id);

-- =====================================================
-- 6. OTIMIZAÇÃO DE ÍNDICES
-- =====================================================

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);

-- =====================================================
-- 7. ATUALIZAÇÃO DE COMENTÁRIOS
-- =====================================================

-- Atualizar comentários das tabelas modificadas
COMMENT ON TABLE public.enrollments IS 'Matrículas dos usuários nos cursos - unifica course_completions e user_progress';
COMMENT ON CONSTRAINT enrollments_user_course_unique ON public.enrollments IS 'Garante que um usuário não pode se matricular duas vezes no mesmo curso';
COMMENT ON CONSTRAINT user_badges_user_badge_unique ON public.user_badges IS 'Garante que um usuário não pode receber o mesmo badge duas vezes';
COMMENT ON CONSTRAINT user_achievements_user_achievement_unique ON public.user_achievements IS 'Garante que um usuário não pode conquistar o mesmo achievement duas vezes';