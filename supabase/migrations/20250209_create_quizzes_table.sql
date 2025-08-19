-- Criar tabela quizzes para armazenar quizzes dos módulos
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL DEFAULT '[]',
    passing_score INTEGER DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
    time_limit_minutes INTEGER,
    max_attempts INTEGER DEFAULT 3,
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar comentários
COMMENT ON TABLE quizzes IS 'Quizzes dos módulos dos cursos';
COMMENT ON COLUMN quizzes.questions IS 'Array de questões em formato JSON';
COMMENT ON COLUMN quizzes.passing_score IS 'Pontuação mínima para aprovação (0-100)';
COMMENT ON COLUMN quizzes.time_limit_minutes IS 'Limite de tempo em minutos (null = sem limite)';
COMMENT ON COLUMN quizzes.max_attempts IS 'Número máximo de tentativas';

-- Habilitar RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "quizzes_select_policy" ON quizzes
    FOR SELECT USING (true);

CREATE POLICY "quizzes_insert_policy" ON quizzes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "quizzes_update_policy" ON quizzes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "quizzes_delete_policy" ON quizzes
    FOR DELETE USING (auth.role() = 'authenticated');

-- Conceder permissões
GRANT ALL PRIVILEGES ON quizzes TO authenticated;
GRANT SELECT ON quizzes TO anon;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_module_id ON quizzes(module_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_active ON quizzes(is_active);
CREATE INDEX IF NOT EXISTS idx_quizzes_order_index ON quizzes(order_index);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_quizzes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quizzes_updated_at_trigger
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_quizzes_updated_at();