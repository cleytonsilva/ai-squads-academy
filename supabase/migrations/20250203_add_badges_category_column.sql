-- Adicionar coluna category na tabela badges
ALTER TABLE badges ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN badges.category IS 'Categoria do badge (ex: completion, achievement, skill)';

-- Atualizar badges existentes com categoria padrão
UPDATE badges SET category = 'achievement' WHERE category IS NULL;