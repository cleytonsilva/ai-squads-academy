-- Criar tabela para eventos de geração
CREATE TABLE IF NOT EXISTS generation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_generation_events_type_created 
  ON generation_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generation_events_created 
  ON generation_events(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE generation_events ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Allow read for authenticated users" ON generation_events
  FOR SELECT TO authenticated USING (true);

-- Política para permitir inserção para service role
CREATE POLICY "Allow insert for service role" ON generation_events
  FOR INSERT TO service_role WITH CHECK (true);

-- Política para permitir inserção para usuários autenticados (para logs do frontend)
CREATE POLICY "Allow insert for authenticated users" ON generation_events
  FOR INSERT TO authenticated WITH CHECK (true);

-- Comentários
COMMENT ON TABLE generation_events IS 'Tabela para armazenar eventos do sistema de geração de imagens';
COMMENT ON COLUMN generation_events.event_type IS 'Tipo do evento (generation_progress, prediction_completed, etc.)';
COMMENT ON COLUMN generation_events.event_data IS 'Dados específicos do evento em formato JSON';