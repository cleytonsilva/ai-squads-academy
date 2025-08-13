-- Script para resetar a senha do usuário admin
-- ATENÇÃO: Execute este script apenas se necessário
-- Este script irá resetar a senha para uma senha temporária

-- 1. Verificar o usuário atual
SELECT 
  'Usuário antes do reset:' as status,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'cleyton7silva@gmail.com';

-- 2. Confirmar email se não estiver confirmado
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'cleyton7silva@gmail.com' 
AND email_confirmed_at IS NULL;

-- 3. Resetar senha para uma senha temporária
-- IMPORTANTE: Altere 'TempPassword123!' para a senha desejada
-- A senha deve ter pelo menos 6 caracteres
UPDATE auth.users 
SET 
  encrypted_password = crypt('TempPassword123!', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'cleyton7silva@gmail.com';

-- 4. Verificar o resultado
SELECT 
  'Usuário após reset:' as status,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  updated_at
FROM auth.users 
WHERE email = 'cleyton7silva@gmail.com';

-- 5. Verificar se o perfil está correto
SELECT 
  'Perfil do usuário:' as status,
  p.id,
  p.user_id,
  p.name,
  p.email,
  p.role,
  u.email as auth_email
FROM public.profiles p 
JOIN auth.users u ON p.user_id = u.id 
WHERE u.email = 'cleyton7silva@gmail.com';

-- INSTRUÇÕES APÓS EXECUTAR ESTE SCRIPT:
-- 1. Tente fazer login com:
--    Email: cleyton7silva@gmail.com
--    Senha: TempPassword123!
-- 2. Após o login bem-sucedido, altere a senha nas configurações do perfil
-- 3. Se ainda houver problemas, verifique os logs do Supabase

-- Mensagem de confirmação
SELECT 'SENHA RESETADA PARA: TempPassword123! - ALTERE APÓS O LOGIN!' as importante;