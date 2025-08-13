-- Script para corrigir políticas RLS da tabela courses
-- Execute este script no Supabase Dashboard se você não quiser refazer todo o banco

-- Remover políticas existentes se houver conflito
DROP POLICY IF EXISTS "Allow admins to insert courses" ON public.courses;
DROP POLICY IF EXISTS "Allow admins to update courses" ON public.courses;
DROP POLICY IF EXISTS "Allow admins to delete courses" ON public.courses;

-- Criar políticas para administradores gerenciarem cursos
CREATE POLICY "Allow admins to insert courses" 
  ON public.courses FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admins to update courses" 
  ON public.courses FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admins to delete courses" 
  ON public.courses FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'courses'
ORDER BY policyname;

-- Verificar se o usuário atual é admin
SELECT 
  profiles.user_id,
  profiles.email,
  profiles.role,
  auth.uid() as current_user_id,
  (profiles.role = 'admin') as is_admin
FROM public.profiles 
WHERE profiles.user_id = auth.uid();

SELECT 'Políticas de courses aplicadas com sucesso!' as status;