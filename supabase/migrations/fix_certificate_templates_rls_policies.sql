-- Migração para corrigir políticas RLS da tabela certificate_templates
-- Data: 2025-01-24
-- Objetivo: Permitir que usuários autenticados possam criar e atualizar templates de certificado

-- 1. Remover a política restritiva atual que só permite admins e instrutores
DROP POLICY IF EXISTS "Apenas admins e instrutores podem gerenciar certificate templates" ON public.certificate_templates;

-- 2. Criar nova política para SELECT (mantém acesso público para visualização)
DROP POLICY IF EXISTS "Certificate templates são visíveis para todos" ON public.certificate_templates;
CREATE POLICY "Certificate templates são visíveis para todos" 
  ON public.certificate_templates 
  FOR SELECT 
  USING (true);

-- 3. Criar política para INSERT (permite usuários autenticados criarem templates)
CREATE POLICY "Usuários autenticados podem criar certificate templates" 
  ON public.certificate_templates 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Criar política para UPDATE (permite usuários autenticados atualizarem templates)
CREATE POLICY "Usuários autenticados podem atualizar certificate templates" 
  ON public.certificate_templates 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Criar política para DELETE (apenas admins e instrutores podem deletar)
CREATE POLICY "Apenas admins e instrutores podem deletar certificate templates" 
  ON public.certificate_templates 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- 6. Verificar se RLS está habilitado na tabela
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

-- 7. Comentário explicativo sobre as mudanças
COMMENT ON TABLE public.certificate_templates IS 'Templates de certificados - RLS atualizado: SELECT (todos), INSERT/UPDATE (autenticados), DELETE (admin/instructor)';

-- 8. Verificar as políticas criadas (para debug)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'certificate_templates'
-- ORDER BY policyname;