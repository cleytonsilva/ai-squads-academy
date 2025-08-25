-- Função para calcular estatísticas de geração de imagens
CREATE OR REPLACE FUNCTION get_generation_stats()
RETURNS TABLE (
  total_predictions INTEGER,
  successful_predictions INTEGER,
  failed_predictions INTEGER,
  pending_predictions INTEGER,
  average_generation_time NUMERIC,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH prediction_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'succeeded') as successful,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      COUNT(*) FILTER (WHERE status IN ('starting', 'processing')) as pending,
      AVG(
        CASE 
          WHEN completed_at IS NOT NULL AND created_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (completed_at::timestamp - created_at::timestamp))
          ELSE NULL 
        END
      ) as avg_time
    FROM replicate_predictions
    WHERE created_at >= NOW() - INTERVAL '30 days'
  )
  SELECT 
    ps.total::INTEGER,
    ps.successful::INTEGER,
    ps.failed::INTEGER,
    ps.pending::INTEGER,
    COALESCE(ps.avg_time, 0)::NUMERIC,
    CASE 
      WHEN ps.total > 0 THEN (ps.successful::NUMERIC / ps.total::NUMERIC * 100)
      ELSE 0
    END::NUMERIC
  FROM prediction_stats ps;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter métricas de performance por engine
CREATE OR REPLACE FUNCTION get_engine_performance_stats()
RETURNS TABLE (
  engine_name TEXT,
  total_predictions INTEGER,
  successful_predictions INTEGER,
  failed_predictions INTEGER,
  success_rate NUMERIC,
  average_generation_time NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(rp.model_name, 'unknown') as engine_name,
    COUNT(*)::INTEGER as total_predictions,
    COUNT(*) FILTER (WHERE rp.status = 'succeeded')::INTEGER as successful_predictions,
    COUNT(*) FILTER (WHERE rp.status = 'failed')::INTEGER as failed_predictions,
    CASE 
      WHEN COUNT(*) > 0 
      THEN (COUNT(*) FILTER (WHERE rp.status = 'succeeded')::NUMERIC / COUNT(*)::NUMERIC * 100)
      ELSE 0
    END::NUMERIC as success_rate,
    AVG(
      CASE 
        WHEN rp.completed_at IS NOT NULL AND rp.created_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (rp.completed_at::timestamp - rp.created_at::timestamp))
        ELSE NULL 
      END
    )::NUMERIC as average_generation_time
  FROM replicate_predictions rp
  WHERE rp.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY rp.model_name
  ORDER BY total_predictions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter eventos de geração recentes
CREATE OR REPLACE FUNCTION get_recent_generation_events(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  event_data JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ge.id,
    ge.event_type,
    ge.event_data,
    ge.created_at
  FROM generation_events ge
  WHERE ge.created_at >= NOW() - INTERVAL '7 days'
  ORDER BY ge.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar eventos antigos (manutenção)
CREATE OR REPLACE FUNCTION cleanup_old_generation_events(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM generation_events 
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_replicate_predictions_status_created 
  ON replicate_predictions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_replicate_predictions_model_created 
  ON replicate_predictions(model_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generation_events_type_created 
  ON generation_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generation_events_created 
  ON generation_events(created_at DESC);

-- Comentários para documentação
COMMENT ON FUNCTION get_generation_stats() IS 'Retorna estatísticas gerais de geração de imagens dos últimos 30 dias';
COMMENT ON FUNCTION get_engine_performance_stats() IS 'Retorna estatísticas de performance por engine de IA';
COMMENT ON FUNCTION get_recent_generation_events(INTEGER) IS 'Retorna eventos de geração recentes dos últimos 7 dias';
COMMENT ON FUNCTION cleanup_old_generation_events(INTEGER) IS 'Remove eventos de geração antigos para manutenção do banco';