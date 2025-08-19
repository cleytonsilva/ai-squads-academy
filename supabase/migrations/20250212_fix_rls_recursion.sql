-- Migração para corrigir recursão infinita nas políticas RLS
-- O problema está na política de admin que causa recursão

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON public.profiles;

-- 2. Desabilitar RLS temporariamente
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Criar uma função auxiliar para verificar se o usuário é admin
-- Esta função evita a recursão usando uma consulta direta
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = user_uuid 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas simples e sem recursão

-- Política para usuários verem seus próprios perfis
CREATE POLICY "users_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários atualizarem seus próprios perfis
CREATE POLICY "users_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para usuários inserirem seus próprios perfis
CREATE POLICY "users_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para admins verem todos os perfis (usando função auxiliar)
CREATE POLICY "admins_select_all" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Política para admins atualizarem todos os perfis
CREATE POLICY "admins_update_all" ON public.profiles
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Política para admins inserirem perfis
CREATE POLICY "admins_insert_all" ON public.profiles
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- 6. Garantir permissões básicas
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;

-- 7. Criar um usuário admin padrão se não existir
DO $$
BEGIN
  -- Verificar se já existe um admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    -- Criar um perfil admin temporário para o primeiro usuário
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);
    
    RAISE NOTICE 'Admin criado para o primeiro usuário da plataforma';
  END IF;
END $$;

-- Comentário
COMMENT ON FUNCTION public.is_admin(uuid) IS 'Função auxiliar para verificar se usuário é admin sem causar recursão';
COMMENT ON TABLE public.profiles IS 'Perfis de usuário com políticas RLS corrigidas (sem recursão)';