-- Criar tabela generation_jobs para controlar jobs de geração de IA
CREATE TABLE IF NOT EXISTS generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('ai_generate_course', 'ai_extend_module', 'ai_generate_certifications')),
    status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    input JSONB NOT NULL DEFAULT '{}',
    output JSONB DEFAULT '{}',
    error TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Adicionar comentários
COMMENT ON TABLE generation_jobs IS 'Jobs de geração de conteúdo por IA';
COMMENT ON COLUMN generation_jobs.type IS 'Tipo do job (ai_generate_course, ai_extend_module, ai_generate_certifications)';
COMMENT ON COLUMN generation_jobs.status IS 'Status do job (queued, processing, completed, failed)';
COMMENT ON COLUMN generation_jobs.input IS 'Parâmetros de entrada do job';
COMMENT ON COLUMN generation_jobs.output IS 'Resultado do job';

-- Habilitar RLS
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "generation_jobs_select_policy" ON generation_jobs
    FOR SELECT USING (true);

CREATE POLICY "generation_jobs_insert_policy" ON generation_jobs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "generation_jobs_update_policy" ON generation_jobs
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "generation_jobs_delete_policy" ON generation_jobs
    FOR DELETE USING (auth.role() = 'authenticated');

-- Conceder permissões
GRANT ALL PRIVILEGES ON generation_jobs TO authenticated;
GRANT SELECT ON generation_jobs TO anon;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_type ON generation_jobs(type);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_created_by ON generation_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_created_at ON generation_jobs(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_generation_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generation_jobs_updated_at_trigger
    BEFORE UPDATE ON generation_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_generation_jobs_updated_at();