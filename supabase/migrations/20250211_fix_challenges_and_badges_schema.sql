-- Migração para corrigir problemas de schema relacionados a desafios e badges
-- Data: 2025-01-15
-- Descrição: Adiciona tabela challenge_participations e colunas faltantes

-- 1. Criar tabela challenge_participations
CREATE TABLE IF NOT EXISTS public.challenge_participations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id uuid NOT NULL REFERENCES public.badge_challenges(id) ON DELETE CASCADE,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    is_completed boolean DEFAULT false,
    progress jsonb DEFAULT '[]'::jsonb,
    points_earned integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, challenge_id)
);

-- 2. Adicionar coluna category na tabela badge_challenges se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'badge_challenges' 
                   AND column_name = 'category' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.badge_challenges 
        ADD COLUMN category varchar(100) DEFAULT 'general';
    END IF;
END $$;

-- 3. Adicionar coluna key na tabela badges se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'badges' 
                   AND column_name = 'key' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.badges 
        ADD COLUMN key varchar(100) UNIQUE;
    END IF;
END $$;

-- 4. Habilitar RLS na nova tabela
ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS para challenge_participations
CREATE POLICY "Users can view their own challenge participations" 
ON public.challenge_participations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge participations" 
ON public.challenge_participations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge participations" 
ON public.challenge_participations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all challenge participations" 
ON public.challenge_participations FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can manage all challenge participations" 
ON public.challenge_participations FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 6. Conceder permissões básicas
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_participations TO authenticated;
GRANT SELECT ON public.challenge_participations TO anon;

-- 7. Atualizar badges existentes com keys únicas se não tiverem
UPDATE public.badges 
SET key = LOWER(REPLACE(REPLACE(name, ' ', '_'), '-', '_')) 
WHERE key IS NULL;

-- 8. Atualizar badge_challenges existentes com categorias padrão se não tiverem
UPDATE public.badge_challenges 
SET category = 'achievement' 
WHERE category IS NULL OR category = '';

-- 9. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_challenge_participations_user_id 
ON public.challenge_participations(user_id);

CREATE INDEX IF NOT EXISTS idx_challenge_participations_challenge_id 
ON public.challenge_participations(challenge_id);

CREATE INDEX IF NOT EXISTS idx_challenge_participations_completed 
ON public.challenge_participations(is_completed);

CREATE INDEX IF NOT EXISTS idx_badge_challenges_category 
ON public.badge_challenges(category);

CREATE INDEX IF NOT EXISTS idx_badges_key 
ON public.badges(key);

-- 10. Comentários para documentação
COMMENT ON TABLE public.challenge_participations IS 'Participações dos usuários em desafios de badges';
COMMENT ON COLUMN public.challenge_participations.progress IS 'Progresso do usuário no desafio em formato JSON';
COMMENT ON COLUMN public.badge_challenges.category IS 'Categoria do desafio (achievement, skill, completion, etc.)';
COMMENT ON COLUMN public.badges.key IS 'Chave única identificadora do badge para referência no código';