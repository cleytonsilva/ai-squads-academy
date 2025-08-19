-- Adicionar colunas faltantes na tabela courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'));
ALTER TABLE courses ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'));
ALTER TABLE courses ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 0;

-- Adicionar comentários
COMMENT ON COLUMN courses.ai_generated IS 'Indica se o curso foi gerado por IA';
COMMENT ON COLUMN courses.status IS 'Status do curso (draft, published, archived)';
COMMENT ON COLUMN courses.difficulty_level IS 'Nível de dificuldade do curso';
COMMENT ON COLUMN courses.estimated_duration IS 'Duração estimada em minutos';

-- Atualizar cursos existentes
UPDATE courses SET 
    ai_generated = false,
    status = CASE WHEN is_published = true THEN 'published' ELSE 'draft' END,
    difficulty_level = COALESCE(level, 'beginner'),
    estimated_duration = COALESCE(duration_hours * 60, 0)
WHERE ai_generated IS NULL;