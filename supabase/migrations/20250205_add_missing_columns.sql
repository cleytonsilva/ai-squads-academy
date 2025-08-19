-- Migração para adicionar colunas faltantes
-- Data: 2025-01-14
-- Descrição: Adiciona colunas xp na tabela profiles e image_url na tabela badges

-- Adicionar coluna xp na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- Adicionar coluna image_url na tabela badges
ALTER TABLE public.badges 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Adicionar colunas faltantes na tabela certificates para compatibilidade com o frontend
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS certificate_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Adicionar colunas faltantes na tabela profiles para compatibilidade com o frontend
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}'::jsonb;

-- Atualizar display_name com o valor de name onde display_name for null
UPDATE public.profiles 
SET display_name = name 
WHERE display_name IS NULL AND name IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.xp IS 'Pontos de experiência do usuário';
COMMENT ON COLUMN public.badges.image_url IS 'URL da imagem do badge';
COMMENT ON COLUMN public.certificates.certificate_number IS 'Número único do certificado';
COMMENT ON COLUMN public.certificates.metadata IS 'Metadados adicionais do certificado';
COMMENT ON COLUMN public.profiles.display_name IS 'Nome de exibição do usuário';
COMMENT ON COLUMN public.profiles.profile_data IS 'Dados adicionais do perfil do usuário';