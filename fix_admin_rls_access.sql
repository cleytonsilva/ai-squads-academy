-- Script para corrigir políticas RLS e garantir acesso do usuário admin
-- Execute este script no Supabase Dashboard

-- 1. Verificar políticas RLS atuais
SELECT 
  'Políticas RLS atuais:' as status,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 2. Remover políticas RLS existentes que podem estar causando problemas
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.profiles;

-- 3. Criar políticas RLS mais permissivas para resolver problemas de acesso

-- Política para SELECT - permitir que usuários vejam todos os perfis
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT
  USING (true);

-- Política para INSERT - permitir que usuários autenticados criem perfis
CREATE POLICY "profiles_insert_authenticated" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política para UPDATE - permitir que usuários atualizem seus próprios perfis ou admins atualizem qualquer perfil
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política para DELETE - permitir que usuários deletem seus próprios perfis ou admins deletem qualquer perfil
CREATE POLICY "profiles_delete_own_or_admin" ON public.profiles
  FOR DELETE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 4. Verificar se o usuário admin existe e corrigir se necessário
DO $$
DECLARE
  _user_id uuid;
  _email text := 'cleyton7silva@gmail.com';
BEGIN
  -- Buscar o user_id do usuário
  SELECT id INTO _user_id 
  FROM auth.users 
  WHERE email = _email;
  
  IF _user_id IS NOT NULL THEN
    -- Verificar se o perfil já existe
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id) THEN
      -- Atualizar perfil existente para admin
      UPDATE public.profiles 
      SET 
        role = 'admin',
        name = COALESCE(name, 'Admin'),
        email = _email,
        updated_at = NOW()
      WHERE user_id = _user_id;
      
      RAISE NOTICE 'Perfil atualizado para admin: %', _email;
    ELSE
      -- Criar novo perfil como admin
      INSERT INTO public.profiles (user_id, name, email, role)
      VALUES (_user_id, 'Admin', _email, 'admin');
      
      RAISE NOTICE 'Novo perfil criado como admin: %', _email;
    END IF;
    
    -- Confirmar email se não estiver confirmado
    UPDATE auth.users 
    SET 
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
    WHERE id = _user_id;
    
  ELSE
    RAISE NOTICE 'Usuário não encontrado na tabela auth.users: %', _email;
  END IF;
END $$;

-- 5. Verificar políticas RLS após as mudanças
SELECT 
  'Políticas RLS após correção:' as status,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 6. Verificar o resultado final
SELECT 
  'Resultado final:' as status,
  p.id,
  p.user_id,
  p.name,
  p.email,
  p.role,
  u.email as auth_email,
  u.email_confirmed_at,
  u.last_sign_in_at
FROM public.profiles p 
JOIN auth.users u ON p.user_id = u.id 
WHERE u.email = 'cleyton7silva@gmail.com';

-- 7. Testar acesso do usuário admin
SELECT 
  'Teste de acesso admin:' as status,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_profiles
FROM public.profiles;

-- INSTRUÇÕES:
-- 1. Execute este script no Supabase Dashboard
-- 2. Verifique se não há erros nas políticas RLS
-- 3. Tente fazer login novamente com cleyton7silva@gmail.com
-- 4. Se ainda houver problemas, execute o script reset_admin_password.sql

SELECT 'POLÍTICAS RLS CORRIGIDAS - TENTE FAZER LOGIN NOVAMENTE!' as importante;