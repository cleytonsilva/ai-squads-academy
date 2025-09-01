-- Migration: Fix Storage RLS Policies for Replicate Webhook
-- Permite que o webhook do Replicate faça upload de imagens usando service role

-- 1. Adicionar política para permitir uploads pelo service role
-- Esta política é necessária para que o webhook do Replicate possa fazer upload das imagens geradas
DROP POLICY IF EXISTS "Service role can upload course images" ON storage.objects;
CREATE POLICY "Service role can upload course images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-images' AND
  auth.role() = 'service_role'
);

-- 2. Adicionar política para permitir atualizações pelo service role
DROP POLICY IF EXISTS "Service role can update course images" ON storage.objects;
CREATE POLICY "Service role can update course images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-images' AND
  auth.role() = 'service_role'
)
WITH CHECK (
  bucket_id = 'course-images' AND
  auth.role() = 'service_role'
);

-- 3. Adicionar política para permitir exclusão pelo service role (se necessário)
DROP POLICY IF EXISTS "Service role can delete course images" ON storage.objects;
CREATE POLICY "Service role can delete course images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-images' AND
  auth.role() = 'service_role'
);

-- 4. Verificar se as políticas existentes ainda funcionam
-- As políticas para admins/instructors devem continuar funcionando

-- 5. Comentários para documentação
COMMENT ON POLICY "Service role can upload course images" ON storage.objects IS 'Permite que Edge Functions (webhook do Replicate) façam upload de imagens usando service role';
COMMENT ON POLICY "Service role can update course images" ON storage.objects IS 'Permite que Edge Functions atualizem imagens usando service role';
COMMENT ON POLICY "Service role can delete course images" ON storage.objects IS 'Permite que Edge Functions excluam imagens usando service role';

-- 6. Verificar configuração final
DO $$
BEGIN
  -- Verificar se o bucket existe
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'course-images') THEN
    RAISE EXCEPTION 'Bucket course-images não encontrado. Execute a migração de criação do bucket primeiro.';
  END IF;
  
  -- Log de sucesso
  RAISE NOTICE 'Políticas RLS para service role configuradas com sucesso no bucket course-images';
END $$;

-- Finalização
SELECT 'Migration completed: Storage RLS policies fixed for Replicate webhook' AS result;