-- Script para corrigir problemas de badges diretamente no banco
-- Execute este script no console SQL do Supabase

-- 1. Adicionar coluna category à tabela badges se não existir
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. Adicionar coluna title à tabela badges se não existir
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS title TEXT;

-- 3. Adicionar coluna is_active à tabela badge_challenges se não existir
ALTER TABLE public.badge_challenges ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. Criar tabela challenge_participations se não existir
CREATE TABLE IF NOT EXISTS public.challenge_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.badge_challenges(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'in_progress',
  progress INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- 5. Habilitar RLS para challenge_participations
ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para challenge_participations
DROP POLICY IF EXISTS "Users can view their own participations" ON public.challenge_participations;
CREATE POLICY "Users can view their own participations" ON public.challenge_participations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own participations" ON public.challenge_participations;
CREATE POLICY "Users can insert their own participations" ON public.challenge_participations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own participations" ON public.challenge_participations;
CREATE POLICY "Users can update their own participations" ON public.challenge_participations
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. Criar tabela user_certificates se não existir
CREATE TABLE IF NOT EXISTS public.user_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_url TEXT,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- 8. Habilitar RLS para user_certificates
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;

-- 9. Políticas RLS para user_certificates
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.user_certificates;
CREATE POLICY "Users can view their own certificates" ON public.user_certificates
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own certificates" ON public.user_certificates;
CREATE POLICY "Users can insert their own certificates" ON public.user_certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. Adicionar triggers de updated_at se não existirem
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para challenge_participations
DROP TRIGGER IF EXISTS update_challenge_participations_updated_at ON public.challenge_participations;
CREATE TRIGGER update_challenge_participations_updated_at
    BEFORE UPDATE ON public.challenge_participations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para user_certificates
DROP TRIGGER IF EXISTS update_user_certificates_updated_at ON public.user_certificates;
CREATE TRIGGER update_user_certificates_updated_at
    BEFORE UPDATE ON public.user_certificates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Verificar se existe problema com múltiplos perfis para o mesmo usuário
-- e corrigir se necessário
WITH duplicate_profiles AS (
  SELECT user_id, COUNT(*) as count
  FROM public.profiles
  GROUP BY user_id
  HAVING COUNT(*) > 1
)
DELETE FROM public.profiles
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.profiles
  ORDER BY user_id, created_at DESC
)
AND user_id IN (SELECT user_id FROM duplicate_profiles);

SELECT 'Correções aplicadas com sucesso!' as status;