-- Script para corrigir políticas RLS e garantir acesso do admin
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Remover todas as políticas existentes da tabela profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem gerenciar todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- 2. Criar políticas simples e não recursivas

-- Permitir que todos os usuários autenticados vejam todos os perfis
-- (necessário para o funcionamento da aplicação)
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Permitir que usuários insiram seus próprios perfis
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários atualizem seus próprios perfis
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários deletem seus próprios perfis
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 3. Garantir que o usuário admin existe e tem a role correta
DO $$
DECLARE
  _user_id uuid;
  _email text := 'cleyton7silva@gmail.com';
BEGIN
  -- Buscar o ID do usuário
  SELECT id INTO _user_id FROM auth.users WHERE email = _email;
  
  IF _user_id IS NULL THEN
    RAISE NOTICE 'Usuário % não encontrado', _email;
    RETURN;
  END IF;
  
  -- Verificar se o perfil já existe
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id) THEN
    -- Atualizar perfil existente
    UPDATE public.profiles 
    SET role = 'admin', 
        updated_at = now()
    WHERE user_id = _user_id;
    RAISE NOTICE 'Perfil atualizado para admin: %', _email;
  ELSE
    -- Inserir novo perfil
    INSERT INTO public.profiles (user_id, name, email, role)
    VALUES (
      _user_id,
      'Cleyton Silva',
      _email,
      'admin'
    );
    RAISE NOTICE 'Novo perfil criado como admin: %', _email;
  END IF;
END $$;

-- 4. Verificar o resultado
SELECT 
  p.id,
  p.user_id,
  p.name,
  p.email,
  p.role,
  u.email as auth_email
FROM public.profiles p 
JOIN auth.users u ON p.user_id = u.id 
WHERE u.email = 'cleyton7silva@gmail.com';

-- 5. Listar todas as políticas ativas na tabela profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;