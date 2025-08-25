-- Migração para corrigir problemas na tabela profiles e permitir criação de usuários por administradores
-- Data: 2025-01-30
-- Descrição: Corrige estrutura da tabela, políticas RLS e função handle_new_user

-- 1. Garantir que todas as colunas necessárias existam na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}'::jsonb;

-- 2. Atualizar display_name com o valor de name onde display_name for null
UPDATE public.profiles 
SET display_name = COALESCE(display_name, name, split_part(email, '@', 1))
WHERE display_name IS NULL;

-- 3. Remover políticas RLS existentes que podem estar causando conflitos
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem gerenciar todos os perfis" ON public.profiles;

-- 4. Criar políticas RLS corrigidas
-- Política para visualização: usuários podem ver seu próprio perfil, admins podem ver todos
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política para atualização: usuários podem atualizar seu próprio perfil, admins podem atualizar todos
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política para inserção: usuários podem inserir seu próprio perfil, admins podem inserir qualquer perfil
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política para exclusão: apenas admins podem excluir perfis
CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Atualizar função handle_new_user para incluir display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _display_name text;
  _avatar_url text;
  _role user_role;
BEGIN
  -- Extrair dados do user_metadata
  _display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'name', 
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  _avatar_url := NEW.raw_user_meta_data->>'avatar_url';
  
  _role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'student'::user_role
  );

  -- Inserir perfil do usuário
  INSERT INTO public.profiles (
    user_id, 
    name, 
    display_name, 
    email, 
    avatar_url, 
    role,
    xp,
    profile_data
  )
  VALUES (
    NEW.id, 
    _display_name, 
    _display_name, 
    NEW.email, 
    _avatar_url, 
    _role,
    0,
    '{}'::jsonb
  )
  ON CONFLICT (user_id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recriar trigger para handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Criar função auxiliar para verificar se usuário é admin (para uso nas políticas)
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Comentários para documentação
COMMENT ON COLUMN public.profiles.display_name IS 'Nome de exibição do usuário';
COMMENT ON COLUMN public.profiles.xp IS 'Pontos de experiência do usuário';
COMMENT ON COLUMN public.profiles.profile_data IS 'Dados adicionais do perfil do usuário em formato JSON';
COMMENT ON FUNCTION public.handle_new_user() IS 'Função que cria automaticamente um perfil quando um novo usuário é registrado';
COMMENT ON FUNCTION public.is_admin(uuid) IS 'Função auxiliar para verificar se um usuário tem papel de administrador';

-- 9. Garantir que perfis existam para todos os usuários auth órfãos
INSERT INTO public.profiles (user_id, name, display_name, email, role, xp, profile_data)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'name', 
    au.raw_user_meta_data->>'full_name',
    split_part(au.email, '@', 1)
  ),
  COALESCE(
    au.raw_user_meta_data->>'display_name',
    au.raw_user_meta_data->>'name', 
    au.raw_user_meta_data->>'full_name',
    split_part(au.email, '@', 1)
  ),
  au.email,
  COALESCE((au.raw_user_meta_data->>'role')::user_role, 'student'::user_role),
  0,
  '{}'::jsonb
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 10. Log de conclusão
DO $$
BEGIN
  RAISE NOTICE 'Migração 20250130000000_fix_profiles_admin_creation.sql aplicada com sucesso!';
  RAISE NOTICE 'Problemas corrigidos:';
  RAISE NOTICE '- Colunas display_name, xp e profile_data adicionadas/verificadas';
  RAISE NOTICE '- Políticas RLS corrigidas para permitir administradores criarem usuários';
  RAISE NOTICE '- Função handle_new_user atualizada';
  RAISE NOTICE '- Perfis criados para usuários órfãos';
END $$;