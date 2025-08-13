-- Script para aplicar manualmente no Supabase SQL Editor
-- Execute cada bloco separadamente para verificar se há erros

-- 1. Adicionar coluna category na tabela badges (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'badges' AND column_name = 'category') THEN
        ALTER TABLE badges ADD COLUMN category VARCHAR(50) DEFAULT 'achievement';
    END IF;
END $$;

-- 2. Adicionar coluna title na tabela badges (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'badges' AND column_name = 'title') THEN
        ALTER TABLE badges ADD COLUMN title VARCHAR(255);
    END IF;
END $$;

-- 3. Adicionar coluna is_active na tabela badge_challenges (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'badge_challenges' AND column_name = 'is_active') THEN
        ALTER TABLE badge_challenges ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 4. Criar tabela challenge_participations (se não existir)
CREATE TABLE IF NOT EXISTS challenge_participations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES badge_challenges(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'in_progress',
    progress JSONB DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- 5. Criar tabela user_certificates (se não existir)
CREATE TABLE IF NOT EXISTS user_certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    certificate_id UUID REFERENCES certificates(id) ON DELETE CASCADE,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    certificate_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, certificate_id)
);

-- 6. Habilitar RLS nas novas tabelas
ALTER TABLE challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certificates ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS para challenge_participations
DROP POLICY IF EXISTS "Users can view own participations" ON challenge_participations;
CREATE POLICY "Users can view own participations" ON challenge_participations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own participations" ON challenge_participations;
CREATE POLICY "Users can insert own participations" ON challenge_participations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own participations" ON challenge_participations;
CREATE POLICY "Users can update own participations" ON challenge_participations
    FOR UPDATE USING (auth.uid() = user_id);

-- 8. Criar políticas RLS para user_certificates
DROP POLICY IF EXISTS "Users can view own certificates" ON user_certificates;
CREATE POLICY "Users can view own certificates" ON user_certificates
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own certificates" ON user_certificates;
CREATE POLICY "Users can insert own certificates" ON user_certificates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Criar triggers para updated_at (se não existirem)
DROP TRIGGER IF EXISTS update_challenge_participations_updated_at ON challenge_participations;
CREATE TRIGGER update_challenge_participations_updated_at
    BEFORE UPDATE ON challenge_participations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_certificates_updated_at ON user_certificates;
CREATE TRIGGER update_user_certificates_updated_at
    BEFORE UPDATE ON user_certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Verificar e corrigir perfis duplicados
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at) as rn
    FROM profiles
)
DELETE FROM profiles 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 12. Atualizar títulos dos badges existentes (se a coluna title estiver vazia)
UPDATE badges 
SET title = name 
WHERE title IS NULL OR title = '';

-- Fim do script
-- Execute este script bloco por bloco no SQL Editor do Supabase