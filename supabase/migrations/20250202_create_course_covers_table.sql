-- Migration: Create Course Covers Table
-- Cria tabela para armazenar capas de cursos com histórico e controle de acesso
-- Data: 2025-02-02

-- 1. Criar tabela course_covers
CREATE TABLE IF NOT EXISTS course_covers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_image_url CHECK (image_url ~ '^https?://.*\.(jpg|jpeg|png|webp|gif)$'),
  CONSTRAINT unique_active_cover_per_course UNIQUE (course_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- 2. Comentários para documentação
COMMENT ON TABLE course_covers IS 'Armazena capas de cursos com histórico e controle de versão';
COMMENT ON COLUMN course_covers.id IS 'Identificador único da capa';
COMMENT ON COLUMN course_covers.course_id IS 'ID do curso relacionado';
COMMENT ON COLUMN course_covers.image_url IS 'URL da imagem da capa';
COMMENT ON COLUMN course_covers.is_active IS 'Indica se esta é a capa ativa do curso';
COMMENT ON COLUMN course_covers.created_by IS 'ID do usuário que criou/fez upload da capa';
COMMENT ON COLUMN course_covers.created_at IS 'Data de criação da capa';
COMMENT ON COLUMN course_covers.updated_at IS 'Data da última atualização';

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_course_covers_course_id ON course_covers(course_id);
CREATE INDEX IF NOT EXISTS idx_course_covers_active ON course_covers(course_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_course_covers_created_by ON course_covers(created_by);
CREATE INDEX IF NOT EXISTS idx_course_covers_created_at ON course_covers(created_at DESC);

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_course_covers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_course_covers_updated_at ON course_covers;
CREATE TRIGGER trigger_update_course_covers_updated_at
  BEFORE UPDATE ON course_covers
  FOR EACH ROW
  EXECUTE FUNCTION update_course_covers_updated_at();

-- 5. Função para ativar uma capa (desativa outras do mesmo curso)
CREATE OR REPLACE FUNCTION activate_course_cover(cover_id UUID)
RETURNS VOID AS $$
DECLARE
  target_course_id UUID;
BEGIN
  -- Buscar course_id da capa
  SELECT course_id INTO target_course_id
  FROM course_covers
  WHERE id = cover_id;
  
  IF target_course_id IS NULL THEN
    RAISE EXCEPTION 'Capa não encontrada';
  END IF;
  
  -- Desativar todas as capas do curso
  UPDATE course_covers
  SET is_active = false, updated_at = NOW()
  WHERE course_id = target_course_id AND is_active = true;
  
  -- Ativar a capa específica
  UPDATE course_covers
  SET is_active = true, updated_at = NOW()
  WHERE id = cover_id;
  
  -- Atualizar cover_image_url na tabela courses
  UPDATE courses
  SET cover_image_url = (
    SELECT image_url FROM course_covers WHERE id = cover_id
  ),
  thumbnail_url = (
    SELECT image_url FROM course_covers WHERE id = cover_id
  ),
  updated_at = NOW()
  WHERE id = target_course_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION activate_course_cover IS 'Ativa uma capa específica e desativa as outras do mesmo curso';

-- 6. Trigger para sincronizar com courses.cover_image_url
CREATE OR REPLACE FUNCTION sync_course_cover_with_courses()
RETURNS TRIGGER AS $$
BEGIN
  -- Se uma capa foi ativada, atualizar a tabela courses
  IF NEW.is_active = true AND (OLD IS NULL OR OLD.is_active = false) THEN
    UPDATE courses
    SET cover_image_url = NEW.image_url,
        thumbnail_url = NEW.image_url,
        updated_at = NOW()
    WHERE id = NEW.course_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_course_cover ON course_covers;
CREATE TRIGGER trigger_sync_course_cover
  AFTER INSERT OR UPDATE ON course_covers
  FOR EACH ROW
  EXECUTE FUNCTION sync_course_cover_with_courses();

-- 7. Políticas RLS (Row Level Security)
ALTER TABLE course_covers ENABLE ROW LEVEL SECURITY;

-- Política para visualização: todos podem ver capas ativas de cursos publicados
DROP POLICY IF EXISTS "Public can view active course covers" ON course_covers;
CREATE POLICY "Public can view active course covers" ON course_covers
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_covers.course_id
      AND courses.is_published = true
    )
  );

-- Política para admins e instrutores: podem ver todas as capas
DROP POLICY IF EXISTS "Admins and instructors can view all covers" ON course_covers;
CREATE POLICY "Admins and instructors can view all covers" ON course_covers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Política para inserção: apenas admins e instrutores
DROP POLICY IF EXISTS "Admins and instructors can insert covers" ON course_covers;
CREATE POLICY "Admins and instructors can insert covers" ON course_covers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Política para atualização: apenas admins e instrutores
DROP POLICY IF EXISTS "Admins and instructors can update covers" ON course_covers;
CREATE POLICY "Admins and instructors can update covers" ON course_covers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Política para exclusão: apenas admins e instrutores
DROP POLICY IF EXISTS "Admins and instructors can delete covers" ON course_covers;
CREATE POLICY "Admins and instructors can delete covers" ON course_covers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- 8. Migrar dados existentes da tabela courses
INSERT INTO course_covers (course_id, image_url, is_active, created_by, created_at)
SELECT 
  c.id as course_id,
  c.cover_image_url as image_url,
  true as is_active,
  COALESCE(
    (SELECT p.id FROM profiles p WHERE p.role = 'admin' LIMIT 1),
    (SELECT p.id FROM profiles p LIMIT 1)
  ) as created_by,
  c.created_at
FROM courses c
WHERE c.cover_image_url IS NOT NULL 
  AND c.cover_image_url != ''
  AND c.cover_image_url ~ '^https?://.*\.(jpg|jpeg|png|webp|gif)$'
  AND NOT EXISTS (
    SELECT 1 FROM course_covers cc WHERE cc.course_id = c.id
  );

-- 9. View para facilitar consultas
CREATE OR REPLACE VIEW course_covers_with_details AS
SELECT 
  cc.*,
  c.title as course_title,
  c.is_published as course_published,
  p.role as creator_role,
  p.user_id as creator_user_id
FROM course_covers cc
JOIN courses c ON cc.course_id = c.id
LEFT JOIN profiles p ON cc.created_by = p.id;

COMMENT ON VIEW course_covers_with_details IS 'View com detalhes completos das capas de cursos';

-- 10. Função para obter capa ativa de um curso
CREATE OR REPLACE FUNCTION get_active_course_cover(p_course_id UUID)
RETURNS TABLE(
  id UUID,
  image_url TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT cc.id, cc.image_url, cc.created_by, cc.created_at
  FROM course_covers cc
  WHERE cc.course_id = p_course_id AND cc.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_active_course_cover IS 'Retorna a capa ativa de um curso específico';

-- 11. Função para histórico de capas
CREATE OR REPLACE FUNCTION get_course_covers_history(p_course_id UUID)
RETURNS TABLE(
  id UUID,
  image_url TEXT,
  is_active BOOLEAN,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  creator_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id,
    cc.image_url,
    cc.is_active,
    cc.created_by,
    cc.created_at,
    p.role as creator_role
  FROM course_covers cc
  LEFT JOIN profiles p ON cc.created_by = p.id
  WHERE cc.course_id = p_course_id
  ORDER BY cc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_course_covers_history IS 'Retorna o histórico de capas de um curso';

-- 12. Grants para roles
GRANT SELECT ON course_covers TO anon;
GRANT SELECT ON course_covers TO authenticated;
GRANT SELECT ON course_covers_with_details TO anon;
GRANT SELECT ON course_covers_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_course_cover TO anon;
GRANT EXECUTE ON FUNCTION get_active_course_cover TO authenticated;
GRANT EXECUTE ON FUNCTION get_course_covers_history TO authenticated;
GRANT EXECUTE ON FUNCTION activate_course_cover TO authenticated;

-- 13. Verificação final
DO $$
BEGIN
  -- Verificar se a tabela foi criada corretamente
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_covers') THEN
    RAISE EXCEPTION 'Falha ao criar tabela course_covers';
  END IF;
  
  -- Verificar se os índices foram criados
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'course_covers' AND indexname = 'idx_course_covers_course_id') THEN
    RAISE EXCEPTION 'Falha ao criar índices da tabela course_covers';
  END IF;
  
  RAISE NOTICE 'Migração course_covers concluída com sucesso!';
END $$;