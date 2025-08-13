-- Migração para padronizar o campo de capa de curso para cover_image_url
-- Esta migração implementa escrita dupla para manter compatibilidade durante a transição

-- 1. Verificar se o campo cover_image_url existe na tabela courses
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='courses' AND column_name='cover_image_url'
    ) THEN
        -- Adicionar coluna cover_image_url se não existir
        ALTER TABLE courses ADD COLUMN cover_image_url TEXT;
    END IF;
END $$;

-- 2. Sincronizar dados existentes: copiar thumbnail_url para cover_image_url onde aplicável
UPDATE courses 
SET cover_image_url = thumbnail_url 
WHERE thumbnail_url IS NOT NULL 
  AND (cover_image_url IS NULL OR cover_image_url = '');

-- 3. Criar função para sincronização bidirecional durante a transição
CREATE OR REPLACE FUNCTION sync_course_image_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Se cover_image_url foi atualizado, sincronizar com thumbnail_url
  IF NEW.cover_image_url IS DISTINCT FROM OLD.cover_image_url THEN
    NEW.thumbnail_url := NEW.cover_image_url;
  END IF;
  
  -- Se thumbnail_url foi atualizado e cover_image_url está vazio, sincronizar
  IF NEW.thumbnail_url IS DISTINCT FROM OLD.thumbnail_url 
     AND (NEW.cover_image_url IS NULL OR NEW.cover_image_url = '') THEN
    NEW.cover_image_url := NEW.thumbnail_url;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger para sincronização automática
DROP TRIGGER IF EXISTS sync_course_image_fields_trigger ON courses;
CREATE TRIGGER sync_course_image_fields_trigger
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION sync_course_image_fields();

-- 5. Atualizar o trigger de geração automática de capa para usar cover_image_url
CREATE OR REPLACE FUNCTION trigger_auto_generate_course_cover()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se é um curso gerado por IA e não tem capa
  IF NEW.ai_generated = true AND (NEW.cover_image_url IS NULL OR NEW.cover_image_url = '') THEN
    -- Inserir job de geração de capa
    INSERT INTO generation_jobs (type, status, input, created_at)
    VALUES (
      'course_cover',
      'queued',
      jsonb_build_object(
        'course_id', NEW.id,
        'title', NEW.title,
        'description', NEW.description,
        'difficulty_level', NEW.difficulty_level
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recriar o trigger para geração de capa
DROP TRIGGER IF EXISTS trigger_course_cover_generation ON courses;
CREATE TRIGGER trigger_course_cover_generation
  AFTER INSERT ON courses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_generate_course_cover();

-- 7. Comentários para documentação
COMMENT ON COLUMN courses.cover_image_url IS 'URL da capa do curso (campo padrão para novas implementações)';
COMMENT ON COLUMN courses.thumbnail_url IS 'URL da capa do curso (campo legado, mantido para compatibilidade)';
COMMENT ON FUNCTION sync_course_image_fields IS 'Sincroniza automaticamente os campos cover_image_url e thumbnail_url durante a transição';
COMMENT ON FUNCTION trigger_auto_generate_course_cover IS 'Gera automaticamente capa para cursos criados por IA usando cover_image_url';