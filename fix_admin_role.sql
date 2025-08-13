-- Script para verificar e corrigir a role do usuário admin
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar se o usuário existe na tabela auth.users
SELECT id, email FROM auth.users WHERE email = 'cleyton7silva@gmail.com';

-- 2. Verificar se o perfil existe na tabela profiles
SELECT p.*, u.email 
FROM public.profiles p 
JOIN auth.users u ON p.user_id = u.id 
WHERE u.email = 'cleyton7silva@gmail.com';

-- 3. Atualizar ou inserir o perfil com role admin
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
      split_part(_email, '@', 1),
      _email,
      'admin'
    );
    RAISE NOTICE 'Novo perfil criado como admin: %', _email;
  END IF;
END $$;

-- 4. Verificar o resultado final
SELECT p.*, u.email 
FROM public.profiles p 
JOIN auth.users u ON p.user_id = u.id 
WHERE u.email = 'cleyton7silva@gmail.com';