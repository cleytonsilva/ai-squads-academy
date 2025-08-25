-- Migration: Implementar correção permanente para capas de curso
-- Data: 2025-08-20
-- Objetivo: Garantir que as capas dos cursos sejam atualizadas automaticamente

-- 1. Função para monitoramento e limpeza automática de predições
CREATE OR REPLACE FUNCTION monitor_and_cleanup_predictions()
RETURNS void AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  -- Marcar predições antigas como failed
  UPDATE replicate_predictions 
  SET 
    status = 'failed',
    updated_at = NOW()
  WHERE 
    status = 'starting' 
    AND created_at < NOW() - INTERVAL '2 hours';
    
  -- Obter número de linhas afetadas
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
  -- Log da limpeza
  INSERT INTO generation_events (event_type, event_data, created_at)
  VALUES (
    'automatic_cleanup',
    json_build_object(
      'cleaned_predictions', cleaned_count,
      'timestamp', NOW()
    ),
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- 2. Função para atualizar capa do curso quando predição for bem-sucedida
CREATE OR REPLACE FUNCTION update_course_cover_on_prediction_success()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se a predição foi bem-sucedida e é do tipo course_cover
  IF NEW.status = 'succeeded' 
     AND NEW.prediction_type = 'course_cover' 
     AND NEW.course_id IS NOT NULL 
     AND NEW.output IS NOT NULL 
     AND NEW.output != '' THEN
    
    -- Atualizar o curso com a nova capa
    UPDATE courses 
    SET 
      cover_image_url = NEW.output,
      updated_at = NOW()
    WHERE id = NEW.course_id;
    
    -- Notificar via realtime
    PERFORM pg_notify(
      'course_cover_updated',
      json_build_object(
        'course_id', NEW.course_id,
        'cover_image_url', NEW.output,
        'timestamp', NOW()
      )::text
    );
    
    -- Log do evento
    INSERT INTO generation_events (event_type, event_data, created_at)
    VALUES (
      'course_cover_updated',
      json_build_object(
        'course_id', NEW.course_id,
        'prediction_id', NEW.prediction_id,
        'cover_image_url', NEW.output,
        'timestamp', NOW()
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar o trigger para atualização automática
DROP TRIGGER IF EXISTS trigger_update_course_cover ON replicate_predictions;
CREATE TRIGGER trigger_update_course_cover
  AFTER UPDATE ON replicate_predictions
  FOR EACH ROW
  WHEN (NEW.status = 'succeeded' AND OLD.status != 'succeeded')
  EXECUTE FUNCTION update_course_cover_on_prediction_success();

-- 4. Função para invalidar cache e notificar frontend
CREATE OR REPLACE FUNCTION notify_course_cover_update(course_id_param UUID, image_url_param TEXT)
RETURNS void AS $$
BEGIN
  -- Registrar evento de atualização
  INSERT INTO generation_events (event_type, event_data, created_at)
  VALUES (
    'cache_invalidated',
    json_build_object(
      'course_id', course_id_param,
      'new_image_url', image_url_param,
      'timestamp', NOW()
    ),
    NOW()
  );
  
  -- Notificar via pg_notify para realtime
  PERFORM pg_notify(
    'course_updates',
    json_build_object(
      'type', 'cover_updated',
      'course_id', course_id_param,
      'cover_image_url', image_url_param,
      'timestamp', NOW()
    )::text
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Executar limpeza inicial de predições antigas
SELECT monitor_and_cleanup_predictions();

-- 6. Comentários e instruções
/*
INSTRUÇÕES PARA CONFIGURAÇÃO COMPLETA:

1. CRON JOB (Executar a cada hora):
   SELECT cron.schedule('cleanup-predictions', '0 * * * *', 'SELECT monitor_and_cleanup_predictions();');

2. MONITORAMENTO:
   - Verificar logs na tabela generation_events
   - Monitorar predições pendentes: SELECT * FROM replicate_predictions WHERE status = 'starting' AND created_at < NOW() - INTERVAL '1 hour';

3. TESTE:
   - Gerar nova capa via admin dashboard
   - Verificar se o trigger atualiza automaticamente o campo cover_image_url
   - Verificar notificações realtime no frontend

4. TROUBLESHOOTING:
   - Se predições ficarem pendentes, executar: SELECT monitor_and_cleanup_predictions();
   - Verificar logs: SELECT * FROM generation_events WHERE event_type IN ('course_cover_updated', 'automatic_cleanup') ORDER BY created_at DESC;
*/