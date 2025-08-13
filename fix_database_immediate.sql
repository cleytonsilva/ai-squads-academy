-- EMERGENCY FIX FOR DATABASE ISSUES
-- Run this directly in Supabase Dashboard SQL Editor
-- URL: https://supabase.com/dashboard/project/ncrlojjfkhevjotchhxi/sql

-- 1. Add missing 'name' column if it doesn't exist
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

-- 2. Drop all problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem gerenciar todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and instructors can view all generation jobs" ON public.generation_jobs;
DROP POLICY IF EXISTS "Admins and instructors can manage tracks" ON public.tracks;
DROP POLICY IF EXISTS "Users can manage their own tracks" ON public.tracks;

-- 3. Create simple, non-recursive policies for profiles
CREATE POLICY "Allow all authenticated users to read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Update all existing profiles to have a name
UPDATE public.profiles 
SET name = COALESCE(
  name,
  split_part(email, '@', 1),
  'User'
)
WHERE name IS NULL OR name = '';

-- 5. Set default value for name column
ALTER TABLE public.profiles 
ALTER COLUMN name SET DEFAULT 'User';

-- 6. Update the handle_new_user function to always set name
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

-- 7. Create simple admin check function
CREATE OR REPLACE FUNCTION public.is_admin_simple()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role directly from profiles table without policy recursion
  SELECT role INTO user_role
  FROM public.profiles 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Recreate policies for other tables without recursion

-- Tracks policies
CREATE POLICY "Allow authenticated users to view public tracks"
  ON public.tracks FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Allow users to manage own tracks"
  ON public.tracks FOR ALL
  TO authenticated
  USING (created_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ))
  WITH CHECK (created_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Generation jobs policies
CREATE POLICY "Allow users to view own generation jobs"
  ON public.generation_jobs FOR SELECT
  TO authenticated
  USING (created_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Allow users to manage own generation jobs"
  ON public.generation_jobs FOR ALL
  TO authenticated
  USING (created_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ))
  WITH CHECK (created_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 10. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- DONE! The database should now work without infinite recursion errors.
-- The 'name' column should exist and be populated for all users.