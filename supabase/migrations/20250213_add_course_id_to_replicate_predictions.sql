-- Migração para adicionar coluna course_id à tabela replicate_predictions existente
-- Data: 2025-02-13
-- Descrição: Adiciona a coluna course_id necessária para a Edge Function generate-course-cover

-- 1. Adicionar coluna course_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='replicate_predictions' AND column_name='course_id'
    ) THEN
        ALTER TABLE replicate_predictions ADD COLUMN course_id UUID;
    END IF;
END $$;

-- 2. Adicionar coluna module_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='replicate_predictions' AND column_name='module_id'
    ) THEN
        ALTER TABLE replicate_predictions ADD COLUMN module_id UUID;
    END IF;
END $$;

-- 3. Adicionar coluna prediction_type se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='replicate_predictions' AND column_name='prediction_type'
    ) THEN
        ALTER TABLE replicate_predictions ADD COLUMN prediction_type TEXT;
    END IF;
END $$;

-- 4. Adicionar constraint para prediction_type se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'replicate_predictions_prediction_type_check'
    ) THEN
        ALTER TABLE replicate_predictions 
        ADD CONSTRAINT replicate_predictions_prediction_type_check 
        CHECK (prediction_type IN ('course_cover', 'module_image'));
    END IF;
END $$;

-- 5. Adicionar foreign key para course_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'replicate_predictions_course_id_fkey'
    ) THEN
        ALTER TABLE replicate_predictions 
        ADD CONSTRAINT replicate_predictions_course_id_fkey 
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Adicionar foreign key para module_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'replicate_predictions_module_id_fkey'
    ) THEN
        ALTER TABLE replicate_predictions 
        ADD CONSTRAINT replicate_predictions_module_id_fkey 
        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 7. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_replicate_predictions_course_id ON replicate_predictions(course_id);
CREATE INDEX IF NOT EXISTS idx_replicate_predictions_module_id ON replicate_predictions(module_id);
CREATE INDEX IF NOT EXISTS idx_replicate_predictions_prediction_type ON replicate_predictions(prediction_type);

-- 8. Atualizar registros existentes com valores padrão
UPDATE replicate_predictions 
SET prediction_type = 'course_cover' 
WHERE prediction_type IS NULL;

-- 9. Comentários para documentação
COMMENT ON COLUMN replicate_predictions.course_id IS 'ID do curso relacionado (para capas de curso)';
COMMENT ON COLUMN replicate_predictions.module_id IS 'ID do módulo relacionado (para imagens de módulo)';
COMMENT ON COLUMN replicate_predictions.prediction_type IS 'Tipo da predição: course_cover ou module_image';