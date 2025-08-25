-- Migração para corrigir tabelas e colunas faltantes
-- Data: 2025-08-23
-- Descrição: Adiciona colunas is_active e cria tabelas user_progress, user_activities, achievements, assessments

-- 1. Adicionar coluna is_active à tabela courses (se não existir)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Adicionar coluna is_active à tabela missions (se não existir)
ALTER TABLE missions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Criar tabela user_progress
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    completion_percentage NUMERIC DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
    time_spent_minutes INTEGER DEFAULT 0,
    modules_completed INTEGER DEFAULT 0,
    total_modules INTEGER DEFAULT 0,
    quiz_scores JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, course_id)
);

-- 4. Criar tabela user_activities
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    activity_type VARCHAR NOT NULL CHECK (activity_type IN ('lesson_completed', 'quiz_completed', 'assignment_submitted', 'course_enrolled', 'course_completed', 'badge_earned')),
    points_earned INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Criar tabela achievements
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    image_url TEXT,
    category VARCHAR DEFAULT 'general',
    points INTEGER DEFAULT 0,
    criteria JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Criar tabela assessments
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description TEXT,
    questions JSONB DEFAULT '[]'::jsonb,
    passing_score INTEGER DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
    time_limit_minutes INTEGER,
    max_attempts INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Criar tabela user_assessment_attempts
CREATE TABLE IF NOT EXISTS user_assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    score NUMERIC DEFAULT 0,
    answers JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_minutes INTEGER DEFAULT 0,
    is_passed BOOLEAN DEFAULT false,
    attempt_number INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_assessments_course_id ON assessments(course_id);
CREATE INDEX IF NOT EXISTS idx_user_assessment_attempts_user_id ON user_assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assessment_attempts_assessment_id ON user_assessment_attempts(assessment_id);

-- 9. Habilitar RLS (Row Level Security) nas novas tabelas
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessment_attempts ENABLE ROW LEVEL SECURITY;

-- 10. Criar políticas RLS básicas

-- Políticas para user_progress
CREATE POLICY "Users can view their own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON user_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para user_activities
CREATE POLICY "Users can view their own activities" ON user_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON user_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para achievements (leitura pública)
CREATE POLICY "Anyone can view active achievements" ON achievements
    FOR SELECT USING (is_active = true);

-- Políticas para assessments
CREATE POLICY "Anyone can view active assessments" ON assessments
    FOR SELECT USING (is_active = true);

-- Políticas para user_assessment_attempts
CREATE POLICY "Users can view their own assessment attempts" ON user_assessment_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessment attempts" ON user_assessment_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessment attempts" ON user_assessment_attempts
    FOR UPDATE USING (auth.uid() = user_id);

-- 11. Conceder permissões básicas aos roles anon e authenticated
GRANT SELECT ON user_progress TO anon, authenticated;
GRANT INSERT, UPDATE ON user_progress TO authenticated;

GRANT SELECT ON user_activities TO anon, authenticated;
GRANT INSERT ON user_activities TO authenticated;

GRANT SELECT ON achievements TO anon, authenticated;

GRANT SELECT ON assessments TO anon, authenticated;

GRANT SELECT ON user_assessment_attempts TO anon, authenticated;
GRANT INSERT, UPDATE ON user_assessment_attempts TO authenticated;

-- 12. Inserir alguns dados de exemplo para achievements
INSERT INTO achievements (name, description, category, points, criteria) VALUES
('Primeiro Curso', 'Complete seu primeiro curso', 'completion', 100, '{"type": "course_completion", "count": 1}'),
('Estudante Dedicado', 'Complete 5 cursos', 'completion', 500, '{"type": "course_completion", "count": 5}'),
('Mestre do Conhecimento', 'Complete 10 cursos', 'completion', 1000, '{"type": "course_completion", "count": 10}'),
('Primeira Missão', 'Complete sua primeira missão', 'mission', 50, '{"type": "mission_completion", "count": 1}'),
('Explorador', 'Complete 10 missões', 'mission', 250, '{"type": "mission_completion", "count": 10}')
ON CONFLICT DO NOTHING;

-- 13. Atualizar dados existentes
-- Definir is_active como true para cursos e missões existentes
UPDATE courses SET is_active = true WHERE is_active IS NULL;
UPDATE missions SET is_active = true WHERE is_active IS NULL;

COMMIT;