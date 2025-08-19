-- Migration: Setup Course Covers Storage and Permissions
-- Configura bucket de storage e políticas para capas de cursos

-- 1. Criar bucket para imagens de cursos se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-images',
  'course-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Políticas de acesso para o bucket course-images

-- Permitir leitura pública das imagens
DROP POLICY IF EXISTS "Public read access for course images" ON storage.objects;
CREATE POLICY "Public read access for course images"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-images');

-- Permitir upload apenas para admins e instrutores
DROP POLICY IF EXISTS "Admins and instructors can upload course images" ON storage.objects;
CREATE POLICY "Admins and instructors can upload course images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- Permitir atualização apenas para admins e instrutores
DROP POLICY IF EXISTS "Admins and instructors can update course images" ON storage.objects;
CREATE POLICY "Admins and instructors can update course images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- Permitir exclusão apenas para admins e instrutores
DROP POLICY IF EXISTS "Admins and instructors can delete course images" ON storage.objects;
CREATE POLICY "Admins and instructors can delete course images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- 3. Verificar se a tabela courses tem os campos necessários
-- (Baseado na migração anterior, os campos já devem existir)

-- Adicionar comentários para documentação
COMMENT ON COLUMN courses.cover_image_url IS 'URL da capa do curso (campo principal)';
COMMENT ON COLUMN courses.thumbnail_url IS 'URL da capa do curso (campo de compatibilidade, sincronizado com cover_image_url)';

-- 4. Função para limpar imagens órfãs (opcional)
CREATE OR REPLACE FUNCTION cleanup_orphaned_course_images()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Esta função pode ser executada periodicamente para limpar imagens não utilizadas
  -- Por enquanto, apenas retorna 0 (implementação futura)
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION cleanup_orphaned_course_images IS 'Remove imagens de cursos que não estão mais sendo utilizadas (implementação futura)';

-- 5. Índices para otimização (se não existirem)
CREATE INDEX IF NOT EXISTS idx_courses_cover_image_url ON courses(cover_image_url) WHERE cover_image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_courses_thumbnail_url ON courses(thumbnail_url) WHERE thumbnail_url IS NOT NULL;

-- 6. Trigger para manter sincronização entre cover_image_url e thumbnail_url
-- (Já existe na migração anterior, mas vamos garantir que está atualizado)
CREATE OR REPLACE FUNCTION sync_course_image_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Sincronizar cover_image_url -> thumbnail_url
  IF NEW.cover_image_url IS DISTINCT FROM OLD.cover_image_url THEN
    NEW.thumbnail_url := NEW.cover_image_url;
  END IF;
  
  -- Sincronizar thumbnail_url -> cover_image_url (compatibilidade reversa)
  IF NEW.thumbnail_url IS DISTINCT FROM OLD.thumbnail_url AND 
     NEW.cover_image_url IS NOT DISTINCT FROM OLD.cover_image_url THEN
    NEW.cover_image_url := NEW.thumbnail_url;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger se necessário
DROP TRIGGER IF EXISTS sync_course_image_fields_trigger ON courses;
CREATE TRIGGER sync_course_image_fields_trigger
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION sync_course_image_fields();

COMMENT ON FUNCTION sync_course_image_fields IS 'Mantém sincronização automática entre cover_image_url e thumbnail_url';
COMMENT ON TRIGGER sync_course_image_fields_trigger ON courses IS 'Trigger para sincronização automática dos campos de imagem';

-- 7. Verificar permissões nas tabelas relacionadas
-- Garantir que as tabelas necessárias têm as permissões corretas

-- Permissões para tabela courses (leitura pública, escrita para admins/instrutores)
DROP POLICY IF EXISTS "Public can view published courses" ON courses;
CREATE POLICY "Public can view published courses" ON courses
FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins and instructors can manage courses" ON courses;
CREATE POLICY "Admins and instructors can manage courses" ON courses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- Permissões para tabela replicate_predictions (já configuradas na migração anterior)
-- Apenas verificar se existem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'replicate_predictions' 
    AND policyname = 'Admins and instructors can manage predictions'
  ) THEN
    CREATE POLICY "Admins and instructors can manage predictions" ON replicate_predictions
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role IN ('admin', 'instructor')
      )
    );
  END IF;
END $$;

-- 8. Inserir dados de exemplo para teste (apenas em desenvolvimento)
-- Comentado para não executar em produção
/*
INSERT INTO courses (title, description, cover_image_url, is_published, status)
VALUES (
  'Curso de Teste - Capas',
  'Curso para testar o sistema de capas automáticas',
  NULL,
  false,
  'draft'
) ON CONFLICT DO NOTHING;
*/

-- Finalização
SELECT 'Migration completed: Course covers storage and permissions configured' AS result;