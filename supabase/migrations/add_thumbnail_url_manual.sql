-- Migração manual para adicionar coluna thumbnail_url à tabela courses
-- Execute este SQL no SQL Editor do Supabase
-- URL: https://supabase.com/dashboard/project/ncrlojjfkhevjotchhxi/sql/new

-- Adicionar coluna thumbnail_url se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE courses ADD COLUMN thumbnail_url TEXT;
    COMMENT ON COLUMN courses.thumbnail_url IS 'Campo de compatibilidade - sincronizado com cover_image_url';
  END IF;
END $$;

-- Sincronizar dados existentes
UPDATE courses 
SET thumbnail_url = cover_image_url 
WHERE cover_image_url IS NOT NULL AND thumbnail_url IS NULL;

-- Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_courses_thumbnail_url ON courses(thumbnail_url);

-- Recriar função de sincronização
CREATE OR REPLACE FUNCTION sync_course_image_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Sincronização bidirecional entre cover_image_url e thumbnail_url
  IF NEW.cover_image_url IS DISTINCT FROM OLD.cover_image_url THEN
    NEW.thumbnail_url = NEW.cover_image_url;
  ELSIF NEW.thumbnail_url IS DISTINCT FROM OLD.thumbnail_url THEN
    NEW.cover_image_url = NEW.thumbnail_url;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
DROP TRIGGER IF EXISTS sync_course_image_fields_trigger ON courses;
CREATE TRIGGER sync_course_image_fields_trigger
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION sync_course_image_fields();