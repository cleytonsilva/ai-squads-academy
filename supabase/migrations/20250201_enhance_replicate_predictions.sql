-- Migration: 20250201_enhance_replicate_predictions.sql
-- Otimização das Edge Functions - Migração para Replicate com MCP
-- Restaura tabela replicate_predictions e cria estruturas para jobs de geração

-- 1. Restaurar tabela replicate_predictions se não existir
CREATE TABLE IF NOT EXISTS replicate_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id TEXT NOT NULL UNIQUE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('course_cover', 'module_image')),
  status TEXT NOT NULL DEFAULT 'starting' CHECK (status IN ('starting', 'processing', 'succeeded', 'failed', 'canceled')),
  input JSONB,
  output TEXT,
  error TEXT,
  logs TEXT,
  metrics JSONB, -- Novo campo para métricas de performance
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Tabela para jobs de geração (novo)
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('course_cover', 'module_images', 'both')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  total_predictions INTEGER NOT NULL DEFAULT 0,
  completed_predictions INTEGER NOT NULL DEFAULT 0,
  failed_predictions INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}',
  results JSONB DEFAULT '{}',
  error_details TEXT,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Tabela para eventos de geração (auditoria)
CREATE TABLE IF NOT EXISTS generation_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES generation_jobs(id) ON DELETE CASCADE,
  prediction_id UUID REFERENCES replicate_predictions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela para cache de prompts (otimização)
CREATE TABLE IF NOT EXISTS prompt_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_hash TEXT NOT NULL UNIQUE,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela para métricas de geração
CREATE TABLE IF NOT EXISTS generation_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_length INTEGER NOT NULL,
  generation_time_ms INTEGER NOT NULL,
  image_size_bytes INTEGER,
  success BOOLEAN NOT NULL,
  error_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Índices otimizados para performance
CREATE INDEX IF NOT EXISTS idx_replicate_predictions_prediction_id ON replicate_predictions(prediction_id);
CREATE INDEX IF NOT EXISTS idx_replicate_predictions_course_id ON replicate_predictions(course_id);
CREATE INDEX IF NOT EXISTS idx_replicate_predictions_module_id ON replicate_predictions(module_id);
CREATE INDEX IF NOT EXISTS idx_replicate_predictions_status ON replicate_predictions(status);
CREATE INDEX IF NOT EXISTS idx_replicate_predictions_status_created ON replicate_predictions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replicate_predictions_created_at ON replicate_predictions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_status ON generation_jobs(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_course_status ON generation_jobs(course_id, status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status_created ON generation_jobs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generation_events_job_type ON generation_events(job_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_events_prediction ON generation_events(prediction_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_cache_hash ON prompt_cache(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_prompt_cache_created ON prompt_cache(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generation_metrics_provider ON generation_metrics(provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_metrics_success ON generation_metrics(success, created_at DESC);

-- 7. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers nas tabelas que precisam
DROP TRIGGER IF EXISTS trigger_update_replicate_predictions_updated_at ON replicate_predictions;
CREATE TRIGGER trigger_update_replicate_predictions_updated_at
  BEFORE UPDATE ON replicate_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_generation_jobs_updated_at ON generation_jobs;
CREATE TRIGGER trigger_update_generation_jobs_updated_at
  BEFORE UPDATE ON generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_prompt_cache_updated_at ON prompt_cache;
CREATE TRIGGER trigger_update_prompt_cache_updated_at
  BEFORE UPDATE ON prompt_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Políticas RLS (Row Level Security)
ALTER TABLE replicate_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para replicate_predictions
DROP POLICY IF EXISTS "Admins and instructors can manage predictions" ON replicate_predictions;
CREATE POLICY "Admins and instructors can manage predictions" ON replicate_predictions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Políticas para generation_jobs
DROP POLICY IF EXISTS "Users can view their own generation jobs" ON generation_jobs;
CREATE POLICY "Users can view their own generation jobs" ON generation_jobs
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins and instructors can manage generation jobs" ON generation_jobs;
CREATE POLICY "Admins and instructors can manage generation jobs" ON generation_jobs
  FOR ALL USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Políticas para generation_events
DROP POLICY IF EXISTS "Admins and instructors can view generation events" ON generation_events;
CREATE POLICY "Admins and instructors can view generation events" ON generation_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- Políticas para prompt_cache (apenas admins)
DROP POLICY IF EXISTS "Admins can manage prompt cache" ON prompt_cache;
CREATE POLICY "Admins can manage prompt cache" ON prompt_cache
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Políticas para generation_metrics (apenas admins)
DROP POLICY IF EXISTS "Admins can view generation metrics" ON generation_metrics;
CREATE POLICY "Admins can view generation metrics" ON generation_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 9. Comentários para documentação
COMMENT ON TABLE replicate_predictions IS 'Armazena informações sobre predições do Replicate para geração de imagens';
COMMENT ON COLUMN replicate_predictions.prediction_id IS 'ID único da predição retornado pela API do Replicate';
COMMENT ON COLUMN replicate_predictions.course_id IS 'ID do curso relacionado (para capas de curso)';
COMMENT ON COLUMN replicate_predictions.module_id IS 'ID do módulo relacionado (para imagens de módulo)';
COMMENT ON COLUMN replicate_predictions.prediction_type IS 'Tipo da predição: course_cover ou module_image';
COMMENT ON COLUMN replicate_predictions.status IS 'Status atual da predição no Replicate';
COMMENT ON COLUMN replicate_predictions.input IS 'Parâmetros de entrada enviados para o Replicate';
COMMENT ON COLUMN replicate_predictions.output IS 'URL da imagem gerada pelo Replicate';
COMMENT ON COLUMN replicate_predictions.error IS 'Mensagem de erro em caso de falha';
COMMENT ON COLUMN replicate_predictions.metrics IS 'Métricas de performance da geração';
COMMENT ON COLUMN replicate_predictions.completed_at IS 'Timestamp de quando a predição foi concluída (sucesso ou falha)';

COMMENT ON TABLE generation_jobs IS 'Controla jobs de geração de imagens com múltiplas predições';
COMMENT ON COLUMN generation_jobs.type IS 'Tipo do job: course_cover, module_images ou both';
COMMENT ON COLUMN generation_jobs.total_predictions IS 'Número total de predições no job';
COMMENT ON COLUMN generation_jobs.completed_predictions IS 'Número de predições completadas';
COMMENT ON COLUMN generation_jobs.failed_predictions IS 'Número de predições que falharam';
COMMENT ON COLUMN generation_jobs.config IS 'Configurações específicas do job';
COMMENT ON COLUMN generation_jobs.results IS 'Resultados consolidados do job';

COMMENT ON TABLE generation_events IS 'Log de eventos para auditoria dos jobs de geração';
COMMENT ON TABLE prompt_cache IS 'Cache de prompts similares para otimização';
COMMENT ON TABLE generation_metrics IS 'Métricas de performance dos provedores de IA';

-- 10. Função para limpeza automática de dados antigos
CREATE OR REPLACE FUNCTION cleanup_old_generation_data()
RETURNS void AS $$
BEGIN
  -- Limpar predições antigas completadas (30 dias)
  DELETE FROM replicate_predictions 
  WHERE completed_at < NOW() - INTERVAL '30 days'
    AND status IN ('succeeded', 'failed');
  
  -- Limpar cache de prompts antigos com baixo uso (7 dias)
  DELETE FROM prompt_cache 
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND usage_count < 2;
  
  -- Limpar métricas antigas (90 dias)
  DELETE FROM generation_metrics 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Limpar eventos antigos (60 dias)
  DELETE FROM generation_events 
  WHERE created_at < NOW() - INTERVAL '60 days';
END;
$$ LANGUAGE plpgsql;

-- Comentário final
COMMENT ON FUNCTION cleanup_old_generation_data() IS 'Função para limpeza automática de dados antigos das tabelas de geração';