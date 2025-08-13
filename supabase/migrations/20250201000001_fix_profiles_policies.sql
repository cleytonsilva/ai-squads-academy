-- Corrigir políticas RLS da tabela profiles para evitar recursão infinita

-- Remover política problemática que causa recursão
DROP POLICY IF EXISTS "Admins podem gerenciar todos os perfis" ON public.profiles;

-- Criar política de admin usando auth.jwt() para evitar recursão
CREATE POLICY "Admins podem gerenciar todos os perfis"
  ON public.profiles FOR ALL
  USING (
    COALESCE(
      (auth.jwt() ->> 'user_metadata' ->> 'role'),
      (auth.jwt() ->> 'app_metadata' ->> 'role')
    ) = 'admin'
    OR
    -- Fallback: verificar se é o próprio usuário
    auth.uid() = user_id
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt() ->> 'user_metadata' ->> 'role'),
      (auth.jwt() ->> 'app_metadata' ->> 'role')
    ) = 'admin'
    OR
    -- Fallback: verificar se é o próprio usuário
    auth.uid() = user_id
  );

-- Política específica para leitura de perfis (mais permissiva)
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;
CREATE POLICY "Usuários podem ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (true);

-- Política para atualização do próprio perfil
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para inserção do próprio perfil
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem inserir próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Função auxiliar para verificar se usuário é admin (sem recursão)
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar primeiro nos metadados do JWT
  IF COALESCE(
    (auth.jwt() ->> 'user_metadata' ->> 'role'),
    (auth.jwt() ->> 'app_metadata' ->> 'role')
  ) = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Se não encontrou nos metadados, verificar na tabela (com limite para evitar recursão)
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid 
    AND role = 'admin'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que a coluna name existe na tabela profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'name'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN name TEXT;
  END IF;
END $$;

-- Atualizar função handle_new_user para garantir que o perfil seja criado corretamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name', 
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'role',
      'user'
    )
  )
  ON CONFLICT (user_id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    role = COALESCE(EXCLUDED.role, profiles.role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;