-- Migração para corrigir problemas do banco de dados
-- Esta migração adiciona colunas e tabelas que estão faltando

-- Adicionar coluna category à tabela badges se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'badges' AND column_name = 'category') THEN
        ALTER TABLE public.badges ADD COLUMN category TEXT;
    END IF;
END $$;

-- Adicionar coluna title à tabela badges se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'badges' AND column_name = 'title') THEN
        ALTER TABLE public.badges ADD COLUMN title TEXT;
    END IF;
END $$;

-- Adicionar coluna is_active à tabela badge_challenges se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'badge_challenges' AND column_name = 'is_active') THEN
        ALTER TABLE public.badge_challenges ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Criar tabela challenge_participations se não existir
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

-- Habilitar RLS para challenge_participations
ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para challenge_participations
DROP POLICY IF EXISTS "Users can view their own participations" ON public.challenge_participations;
CREATE POLICY "Users can view their own participations" ON public.challenge_participations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own participations" ON public.challenge_participations;
CREATE POLICY "Users can insert their own participations" ON public.challenge_participations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own participations" ON public.challenge_participations;
CREATE POLICY "Users can update their own participations" ON public.challenge_participations
  FOR UPDATE USING (auth.uid() = user_id);

-- Criar tabela user_certificates se não existir
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

-- Habilitar RLS para user_certificates
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_certificates
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.user_certificates;
CREATE POLICY "Users can view their own certificates" ON public.user_certificates
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own certificates" ON public.user_certificates;
CREATE POLICY "Users can insert their own certificates" ON public.user_certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Adicionar triggers de updated_at se não existirem
DO $$
BEGIN
    -- Trigger para challenge_participations
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_challenge_participations_updated_at') THEN
        CREATE TRIGGER update_challenge_participations_updated_at
            BEFORE UPDATE ON public.challenge_participations
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    -- Trigger para user_certificates
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_certificates_updated_at') THEN
        CREATE TRIGGER update_user_certificates_updated_at
            BEFORE UPDATE ON public.user_certificates
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Verificar e corrigir chaves estrangeiras na tabela user_badges
DO $$
BEGIN
    -- Verificar se a constraint existe e removê-la se necessário
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'user_badges' AND constraint_name = 'user_badges_user_id_fkey') THEN
        ALTER TABLE public.user_badges DROP CONSTRAINT user_badges_user_id_fkey;
    END IF;
    
    -- Criar a constraint correta
    ALTER TABLE public.user_badges ADD CONSTRAINT user_badges_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;