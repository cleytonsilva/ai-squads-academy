-- Adicionar coluna requirements à tabela certificate_templates
ALTER TABLE certificate_templates 
ADD COLUMN requirements JSONB DEFAULT '{"completion_percentage": 100, "min_score": null, "required_modules": []}'::jsonb;

-- Comentário explicativo da coluna
COMMENT ON COLUMN certificate_templates.requirements IS 'Requisitos para emissão do certificado (porcentagem de conclusão, nota mínima, módulos obrigatórios)';

-- Garantir que a coluna não seja nula
ALTER TABLE certificate_templates 
ALTER COLUMN requirements SET NOT NULL;