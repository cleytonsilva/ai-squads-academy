-- Adicionar coluna requirements à tabela badge_templates
-- Esta migração adiciona uma coluna JSONB para armazenar requisitos de badges
-- e migra os dados existentes da coluna completion_percentage

-- Adicionar a nova coluna requirements
ALTER TABLE badge_templates 
ADD COLUMN IF NOT EXISTS requirements JSONB NOT NULL DEFAULT '{
  "completion_percentage": 100,
  "min_score": null,
  "required_modules": []
}'::jsonb;

-- Migrar dados existentes da coluna completion_percentage para a nova estrutura
UPDATE badge_templates 
SET requirements = jsonb_build_object(
  'completion_percentage', completion_percentage,
  'min_score', null,
  'required_modules', '[]'::jsonb
)
WHERE requirements = '{
  "completion_percentage": 100,
  "min_score": null,
  "required_modules": []
}'::jsonb;

-- Remover a coluna completion_percentage antiga (opcional - comentado por segurança)
-- ALTER TABLE badge_templates DROP COLUMN IF EXISTS completion_percentage;

-- Comentário explicativo
COMMENT ON COLUMN badge_templates.requirements IS 'Requisitos para obtenção do badge (porcentagem de conclusão, nota mínima, módulos obrigatórios)';