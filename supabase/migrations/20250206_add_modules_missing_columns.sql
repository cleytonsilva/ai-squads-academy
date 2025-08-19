-- Adicionar colunas faltantes na tabela modules
ALTER TABLE modules ADD COLUMN IF NOT EXISTS content_jsonb JSONB DEFAULT '{}';
ALTER TABLE modules ADD COLUMN IF NOT EXISTS module_type VARCHAR(50) DEFAULT 'content' CHECK (module_type IN ('content', 'quiz', 'assignment', 'final_exam'));

-- Adicionar comentários
COMMENT ON COLUMN modules.content_jsonb IS 'Conteúdo do módulo em formato JSON (html, summary, etc.)';
COMMENT ON COLUMN modules.module_type IS 'Tipo do módulo (content, quiz, assignment, final_exam)';

-- Migrar dados existentes se houver
UPDATE modules SET 
    content_jsonb = COALESCE(content_jsonb, '{}'),
    module_type = COALESCE(module_type, 'content')
WHERE content_jsonb IS NULL OR module_type IS NULL;