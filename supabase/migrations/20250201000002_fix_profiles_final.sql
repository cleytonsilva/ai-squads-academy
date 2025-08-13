-- Fix profiles table issues: missing name column and infinite recursion in policies

-- 1. Ensure the name column exists in profiles table
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

-- 2. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem gerenciar todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 3. Create simple, non-recursive policies

-- Allow all authenticated users to read all profiles (needed for app functionality)
CREATE POLICY "Allow authenticated users to read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Allow users to insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own profile
CREATE POLICY "Allow users to delete own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Create a simple admin check function without recursion
CREATE OR REPLACE FUNCTION public.is_admin_simple()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check JWT metadata first (fastest)
  IF COALESCE(
    (auth.jwt() ->> 'user_metadata' ->> 'role'),
    (auth.jwt() ->> 'app_metadata' ->> 'role')
  ) = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Direct query without policy recursion
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin')
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update the handle_new_user function to ensure name is always set
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name', 
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1),
      'User'
    ),
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'role',
      'user'
    )
  )
  ON CONFLICT (user_id) DO UPDATE SET
    name = COALESCE(
      EXCLUDED.name, 
      profiles.name,
      split_part(profiles.email, '@', 1),
      'User'
    ),
    email = COALESCE(EXCLUDED.email, profiles.email),
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Ensure all existing profiles have a name
UPDATE public.profiles 
SET name = COALESCE(
  name,
  split_part(email, '@', 1),
  'User'
)
WHERE name IS NULL OR name = '';

-- 7. Make name column NOT NULL with a default
ALTER TABLE public.profiles 
ALTER COLUMN name SET DEFAULT 'User',
ALTER COLUMN name SET NOT NULL;

-- 8. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 9. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;