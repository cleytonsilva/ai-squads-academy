-- Migração para configurar políticas RLS do bucket course-images

-- 1. Função para criar políticas de storage
CREATE OR REPLACE FUNCTION create_storage_policy(
  policy_name TEXT,
  bucket_name TEXT,
  operation TEXT,
  definition TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Verificar se a política já existe
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE name = policy_name AND bucket_id = bucket_name
  ) THEN
    -- Criar a política usando SQL dinâmico
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR %s USING (%s)',
      policy_name,
      operation,
      definition
    );
    
    -- Inserir registro na tabela de políticas
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES (policy_name, bucket_name, operation, definition);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Habilitar RLS no bucket course-images
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas existentes se houver conflito
DROP POLICY IF EXISTS "course_images_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "course_images_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "course_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "course_images_delete_policy" ON storage.objects;

-- 4. Criar política para leitura pública
CREATE POLICY "course_images_read_policy" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'course-images');

-- 5. Criar política para upload por usuários autenticados
CREATE POLICY "course_images_upload_policy" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'course-images' 
    AND auth.role() = 'authenticated'
  );

-- 6. Criar política para atualização por usuários autenticados
CREATE POLICY "course_images_update_policy" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'course-images' 
    AND auth.role() = 'authenticated'
  )
  WITH CHECK (
    bucket_id = 'course-images' 
    AND auth.role() = 'authenticated'
  );

-- 7. Criar política para exclusão por usuários autenticados
CREATE POLICY "course_images_delete_policy" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'course-images' 
    AND auth.role() = 'authenticated'
  );

-- 8. Garantir que o bucket course-images existe e está configurado corretamente
DO $$
BEGIN
  -- Verificar se o bucket existe
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'course-images') THEN
    -- Criar bucket se não existir
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'course-images',
      'course-images', 
      true,
      52428800, -- 50MB
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    );
  ELSE
    -- Atualizar configurações do bucket existente
    UPDATE storage.buckets 
    SET 
      public = true,
      file_size_limit = 52428800,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    WHERE id = 'course-images';
  END IF;
END $$;

-- 9. Comentários para documentação
COMMENT ON FUNCTION create_storage_policy IS 'Função auxiliar para criar políticas de storage de forma segura';
COMMENT ON POLICY "course_images_read_policy" ON storage.objects IS 'Permite leitura pública de imagens de curso';
COMMENT ON POLICY "course_images_upload_policy" ON storage.objects IS 'Permite upload de imagens por usuários autenticados';
COMMENT ON POLICY "course_images_update_policy" ON storage.objects IS 'Permite atualização de imagens por usuários autenticados';
COMMENT ON POLICY "course_images_delete_policy" ON storage.objects IS 'Permite exclusão de imagens por usuários autenticados';

-- 10. Verificar configuração final
DO $$
DECLARE
  bucket_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Contar buckets
  SELECT COUNT(*) INTO bucket_count FROM storage.buckets WHERE id = 'course-images';
  
  -- Contar políticas
  SELECT COUNT(*) INTO policy_count FROM pg_policies 
  WHERE tablename = 'objects' AND schemaname = 'storage' 
  AND policyname LIKE 'course_images_%';
  
  -- Log de verificação
  RAISE NOTICE 'Configuração do storage concluída:';
  RAISE NOTICE '- Buckets course-images: %', bucket_count;
  RAISE NOTICE '- Políticas configuradas: %', policy_count;
END $$;