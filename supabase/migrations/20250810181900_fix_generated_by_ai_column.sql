-- Fix inconsistency between ai_generated and generated_by_ai column references
-- This migration standardizes the column name to 'ai_generated' and updates the trigger

-- Update the trigger function to use the correct column name
CREATE OR REPLACE FUNCTION trigger_auto_generate_course_cover()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se é um curso gerado por IA e não tem capa
  IF NEW.ai_generated = true AND (NEW.cover_image_url IS NULL OR NEW.cover_image_url = '') THEN
    -- Inserir job de geração de capa
    INSERT INTO generation_jobs (type, status, input, created_at)
    VALUES (
      'course_cover',
      'queued',
      jsonb_build_object(
        'course_id', NEW.id,
        'title', NEW.title,
        'description', NEW.description,
        'level', NEW.level
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS trigger_course_cover_generation ON courses;
CREATE TRIGGER trigger_course_cover_generation
  AFTER INSERT ON courses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_generate_course_cover();

-- Add comment for documentation
COMMENT ON FUNCTION trigger_auto_generate_course_cover IS 'Automatically creates image generation job for AI-generated courses without cover images';