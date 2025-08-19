-- Criar tabela badge_challenges
CREATE TABLE IF NOT EXISTS badge_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    challenge_type VARCHAR(50) NOT NULL CHECK (challenge_type IN ('completion', 'score', 'time', 'streak', 'custom')),
    challenge_data JSONB NOT NULL DEFAULT '{}',
    target_value NUMERIC,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar comentários
COMMENT ON TABLE badge_challenges IS 'Desafios associados aos badges';
COMMENT ON COLUMN badge_challenges.challenge_type IS 'Tipo do desafio (completion, score, time, streak, custom)';
COMMENT ON COLUMN badge_challenges.challenge_data IS 'Dados específicos do desafio em formato JSON';
COMMENT ON COLUMN badge_challenges.target_value IS 'Valor alvo para completar o desafio';

-- Habilitar RLS
ALTER TABLE badge_challenges ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "badge_challenges_select_policy" ON badge_challenges
    FOR SELECT USING (true);

CREATE POLICY "badge_challenges_insert_policy" ON badge_challenges
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "badge_challenges_update_policy" ON badge_challenges
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "badge_challenges_delete_policy" ON badge_challenges
    FOR DELETE USING (auth.role() = 'authenticated');

-- Conceder permissões
GRANT ALL PRIVILEGES ON badge_challenges TO authenticated;
GRANT SELECT ON badge_challenges TO anon;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_badge_challenges_badge_id ON badge_challenges(badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_challenges_challenge_type ON badge_challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_badge_challenges_is_active ON badge_challenges(is_active);