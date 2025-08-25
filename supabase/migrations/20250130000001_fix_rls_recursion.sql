-- Migração para corrigir recursão infinita nas políticas RLS da tabela profiles
-- Data: 2025-01-30
-- Descrição: Remove políticas problemáticas e cria políticas seguras usando auth.jwt()

-- 1. Remover TODAS as políticas RLS existentes que causam recursão
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem gerenciar todos os perfis" ON public.profiles;
-- Remover políticas que dependem da função is_admin
DROP POLICY IF EXISTS "admins_select_all" ON public.profiles;
DROP POLICY IF EXISTS "admins_update_all" ON public.profiles;
DROP POLICY IF EXISTS "admins_insert_all" ON public.profiles;
DROP POLICY IF EXISTS "admins_delete_all" ON public.profiles;

-- 2. Remover a função is_admin que causa recursão
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

-- 3. Criar políticas RLS seguras usando auth.jwt() para evitar recursão
-- Política para SELECT: usuários podem ver seu próprio perfil
-- Admins podem ver todos os perfis (usando claim do JWT)
CREATE POLICY "profiles_select_safe" ON public.profiles
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- Política para UPDATE: usuários podem atualizar seu próprio perfil
-- Admins podem atualizar todos os perfis
CREATE POLICY "profiles_update_safe" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- Política para INSERT: usuários podem inserir seu próprio perfil
-- Admins podem inserir qualquer perfil
CREATE POLICY "profiles_insert_safe" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- Política para DELETE: apenas admins podem excluir perfis
CREATE POLICY "profiles_delete_safe" ON public.profiles
  FOR DELETE USING (
    (auth.jwt() ->> 'role')::text = 'admin'
  );

-- 4. Atualizar o perfil do usuário admin para garantir role correta
UPDATE public.profiles 
SET role = 'admin'
WHERE user_id = '190312c8-eb66-41ae-9e9c-060bdef95bb3';

-- 5. Atualizar os metadados do usuário no auth.users para incluir a role no JWT
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE id = '190312c8-eb66-41ae-9e9c-060bdef95bb3';

-- 6. Log de conclusão
DO $$
BEGIN
  RAISE NOTICE 'Migração 20250130000001_fix_rls_recursion.sql aplicada com sucesso!';
  RAISE NOTICE 'Problemas corrigidos:';
  RAISE NOTICE '- Políticas RLS recursivas removidas';
  RAISE NOTICE '- Políticas RLS seguras criadas usando auth.jwt()';
  RAISE NOTICE '- Perfil do admin atualizado';
  RAISE NOTICE '- Metadados do JWT atualizados';
  RAISE NOTICE '- Função is_admin problemática removida';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANTE: Faça logout e login novamente para atualizar o JWT!';
END $$;