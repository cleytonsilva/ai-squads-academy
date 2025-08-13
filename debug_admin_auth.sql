-- Script para diagnosticar problemas de autenticação do usuário admin
-- Execute este script no Supabase Dashboard para verificar o status

-- 1. Verificar se o usuário existe na tabela auth.users
SELECT 
  'Usuário na tabela auth.users:' as status,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'cleyton7silva@gmail.com';

-- 2. Verificar se o perfil existe na tabela profiles
SELECT 
  'Perfil na tabela profiles:' as status,
  p.id,
  p.user_id,
  p.name,
  p.email,
  p.role,
  p.created_at,
  p.updated_at
FROM public.profiles p 
JOIN auth.users u ON p.user_id = u.id 
WHERE u.email = 'cleyton7silva@gmail.com';

-- 3. Verificar se há problemas de sincronização entre auth.users e profiles
SELECT 
  'Usuários sem perfil:' as status,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
AND u.email = 'cleyton7silva@gmail.com';

-- 4. Verificar políticas RLS ativas na tabela profiles
SELECT 
  'Políticas RLS ativas:' as status,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 5. Verificar se RLS está habilitado na tabela profiles
SELECT 
  'Status RLS:' as status,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 6. Tentar criar/atualizar o perfil admin se necessário
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
  ELSE
    RAISE NOTICE 'Usuário não encontrado na tabela auth.users: %', _email;
  END IF;
END $$;

-- 7. Verificar o resultado final após a correção
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

-- 8. Verificar se há outros usuários admin
SELECT 
  'Outros usuários admin:' as status,
  p.id,
  p.user_id,
  p.name,
  p.email,
  p.role,
  u.email as auth_email
FROM public.profiles p 
JOIN auth.users u ON p.user_id = u.id 
WHERE p.role = 'admin';