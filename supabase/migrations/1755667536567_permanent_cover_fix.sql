-- Migration: Implementar correção permanente para capas de curso
-- Data: 2025-08-20T05:25:36.567Z


CREATE OR REPLACE FUNCTION monitor_and_cleanup_predictions()
RETURNS void AS $$
BEGIN
  -- Marcar predições antigas como failed
  UPDATE replicate_predictions 
  SET 
    status = 'failed',
    updated_at = NOW()
  WHERE 
    status = 'starting' 
    AND created_at < NOW() - INTERVAL '2 hours';
    
  -- Log da limpeza
  INSERT INTO generation_events (event_type, event_data, created_at)
  VALUES (
    'automatic_cleanup',
    json_build_object(
      'cleaned_predictions', ROW_COUNT,
      'timestamp', NOW()
    ),
    NOW()
  );
END;
$$ LANGUAGE plpgsql;



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

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_update_course_cover ON replicate_predictions;
CREATE TRIGGER trigger_update_course_cover
  AFTER UPDATE ON replicate_predictions
  FOR EACH ROW
  WHEN (NEW.status = 'succeeded' AND OLD.status != 'succeeded')
  EXECUTE FUNCTION update_course_cover_on_prediction_success();


-- Criar job para limpeza automática (executar a cada hora)
-- Nota: Isso deve ser configurado no cron do sistema ou scheduler do Supabase
-- SELECT cron.schedule('cleanup-predictions', '0 * * * *', 'SELECT monitor_and_cleanup_predictions();');

-- Comentários:
-- 1. A função monitor_and_cleanup_predictions() deve ser executada periodicamente
-- 2. O trigger update_course_cover_on_prediction_success() atualiza automaticamente as capas
-- 3. Logs são registrados na tabela generation_events para monitoramento
