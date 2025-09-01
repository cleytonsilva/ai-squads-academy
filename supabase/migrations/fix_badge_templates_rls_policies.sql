-- Corrigir políticas RLS para badge_templates
-- Remove a política restritiva atual e cria novas políticas mais permissivas

-- Remover a política restritiva atual que só permite operações para admins/instrutores
DROP POLICY IF EXISTS "Apenas admins e instrutores podem gerenciar badge templates" ON public.badge_templates;

-- Criar política para INSERT - permite usuários autenticados criarem templates
CREATE POLICY "Usuários autenticados podem criar badge templates" ON public.badge_templates
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Criar política para UPDATE - permite usuários autenticados atualizarem templates
CREATE POLICY "Usuários autenticados podem atualizar badge templates" ON public.badge_templates
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Criar política para DELETE - apenas admins e instrutores podem excluir
CREATE POLICY "Apenas admins e instrutores podem excluir badge templates" ON public.badge_templates
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- A política de SELECT já existe e permite acesso público
-- "Badge templates são visíveis para todos" - mantemos esta política

-- Comentário explicativo
COMMENT ON TABLE badge_templates IS 'Templates de badges com permissões: SELECT (público), INSERT/UPDATE (autenticados), DELETE (admin/instructor)';