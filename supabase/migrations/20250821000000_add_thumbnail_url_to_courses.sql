-- Migração para adicionar coluna thumbnail_url à tabela courses
-- Esta coluna é necessária para compatibilidade com as funções existentes

-- Verificar se a coluna thumbnail_url já existe na tabela courses
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='courses' AND column_name='thumbnail_url'
    ) THEN
        -- Adicionar coluna thumbnail_url se não existir
        ALTER TABLE courses ADD COLUMN thumbnail_url TEXT;
        
        -- Sincronizar dados existentes: copiar cover_image_url para thumbnail_url
        UPDATE courses 
        SET thumbnail_url = cover_image_url 
        WHERE cover_image_url IS NOT NULL 
          AND cover_image_url != '';
          
        -- Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_courses_thumbnail_url ON courses(thumbnail_url) WHERE thumbnail_url IS NOT NULL;
        
        -- Adicionar comentário
        COMMENT ON COLUMN courses.thumbnail_url IS 'URL da capa do curso (campo de compatibilidade, sincronizado com cover_image_url)';
        
        RAISE NOTICE 'Coluna thumbnail_url adicionada à tabela courses com sucesso';
    ELSE
        RAISE NOTICE 'Coluna thumbnail_url já existe na tabela courses';
    END IF;
END $$;

-- Garantir que a função de sincronização existe
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

-- Garantir que o trigger de sincronização existe
DROP TRIGGER IF EXISTS sync_course_image_fields_trigger ON courses;
CREATE TRIGGER sync_course_image_fields_trigger
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION sync_course_image_fields();

COMMENT ON FUNCTION sync_course_image_fields IS 'Sincroniza automaticamente os campos cover_image_url e thumbnail_url';