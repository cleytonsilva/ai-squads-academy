-- Migration: Course Automation System
-- Adds templates for badges and certificates, triggers for automation, and course completion tracking

-- Badge templates table
CREATE TABLE IF NOT EXISTS public.badge_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  design_config jsonb NOT NULL DEFAULT '{"background_color": "#1e40af", "text_color": "#ffffff", "border_style": "solid", "icon": "trophy"}'::jsonb,
  requirements jsonb NOT NULL DEFAULT '{"completion_percentage": 100, "min_score": null, "required_modules": []}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.badge_templates ENABLE ROW LEVEL SECURITY;

-- Certificate templates table
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  design_config jsonb NOT NULL DEFAULT '{"template_style": "modern", "primary_color": "#1e40af", "secondary_color": "#64748b", "logo_position": "top-center", "signature_fields": []}'::jsonb,
  content_template text NOT NULL DEFAULT 'Certificamos que {student_name} concluiu com sucesso o curso {course_title} com {completion_percentage}% de aproveitamento.',
  requirements jsonb NOT NULL DEFAULT '{"completion_percentage": 100, "min_final_exam_score": 70, "required_modules": []}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

-- Course completion tracking table
CREATE TABLE IF NOT EXISTS public.course_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completion_percentage decimal(5,2) NOT NULL DEFAULT 0,
  completed_modules_count integer NOT NULL DEFAULT 0,
  total_modules_count integer NOT NULL DEFAULT 0,
  final_exam_score decimal(5,2),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
ALTER TABLE public.course_completions ENABLE ROW LEVEL SECURITY;

-- Add triggers for updated_at
CREATE TRIGGER update_badge_templates_updated_at
BEFORE UPDATE ON public.badge_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certificate_templates_updated_at
BEFORE UPDATE ON public.certificate_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_completions_updated_at
BEFORE UPDATE ON public.course_completions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate course completion
CREATE OR REPLACE FUNCTION calculate_course_completion(p_user_id uuid, p_course_id uuid)
RETURNS void AS $$
DECLARE
  v_total_modules integer;
  v_completed_modules integer;
  v_completion_percentage decimal(5,2);
  v_final_exam_score decimal(5,2);
BEGIN
  -- Get total modules count
  SELECT COUNT(*) INTO v_total_modules
  FROM modules
  WHERE course_id = p_course_id;
  
  -- Get completed modules count
  SELECT COUNT(*) INTO v_completed_modules
  FROM user_progress
  WHERE user_id = p_user_id 
    AND course_id = p_course_id 
    AND is_completed = true;
  
  -- Calculate completion percentage
  IF v_total_modules > 0 THEN
    v_completion_percentage := (v_completed_modules::decimal / v_total_modules::decimal) * 100;
  ELSE
    v_completion_percentage := 0;
  END IF;
  
  -- Get final exam score if exists
  SELECT 
    CASE 
      WHEN qa.total_questions > 0 THEN (qa.correct_answers::decimal / qa.total_questions::decimal) * 100
      ELSE NULL
    END INTO v_final_exam_score
  FROM quiz_attempts qa
  JOIN quizzes q ON qa.quiz_id = q.id
  WHERE qa.user_id = p_user_id 
    AND q.course_id = p_course_id 
    AND q.is_final_exam = true
  ORDER BY qa.created_at DESC
  LIMIT 1;
  
  -- Insert or update course completion
  INSERT INTO course_completions (
    user_id, 
    course_id, 
    completion_percentage, 
    completed_modules_count, 
    total_modules_count,
    final_exam_score,
    completed_at
  )
  VALUES (
    p_user_id, 
    p_course_id, 
    v_completion_percentage, 
    v_completed_modules, 
    v_total_modules,
    v_final_exam_score,
    CASE WHEN v_completion_percentage >= 100 THEN now() ELSE NULL END
  )
  ON CONFLICT (user_id, course_id)
  DO UPDATE SET
    completion_percentage = EXCLUDED.completion_percentage,
    completed_modules_count = EXCLUDED.completed_modules_count,
    total_modules_count = EXCLUDED.total_modules_count,
    final_exam_score = EXCLUDED.final_exam_score,
    completed_at = CASE 
      WHEN EXCLUDED.completion_percentage >= 100 AND course_completions.completed_at IS NULL 
      THEN now() 
      ELSE course_completions.completed_at 
    END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to auto-award badges and certificates
CREATE OR REPLACE FUNCTION auto_award_achievements(p_user_id uuid, p_course_id uuid)
RETURNS void AS $$
DECLARE
  v_completion record;
  v_badge_template record;
  v_certificate_template record;
  v_badge_id uuid;
BEGIN
  -- Get current completion status
  SELECT * INTO v_completion
  FROM course_completions
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  IF v_completion IS NULL THEN
    RETURN;
  END IF;
  
  -- Check and award badges
  FOR v_badge_template IN 
    SELECT * FROM badge_templates 
    WHERE course_id = p_course_id AND is_active = true
  LOOP
    -- Check if requirements are met
    IF v_completion.completion_percentage >= COALESCE((v_badge_template.requirements->>'completion_percentage')::decimal, 100) THEN
      -- Check if badge doesn't already exist for this user
      IF NOT EXISTS (
        SELECT 1 FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = p_user_id 
          AND b.key = 'course_' || p_course_id || '_' || v_badge_template.id
      ) THEN
        -- Create badge if it doesn't exist
        INSERT INTO badges (key, name, description, image_url, style)
        VALUES (
          'course_' || p_course_id || '_' || v_badge_template.id,
          v_badge_template.name,
          v_badge_template.description,
          NULL, -- Will be generated by the editor
          v_badge_template.design_config
        )
        ON CONFLICT (key) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          style = EXCLUDED.style
        RETURNING id INTO v_badge_id;
        
        -- Award badge to user
        INSERT INTO user_badges (user_id, badge_id, source)
        VALUES (p_user_id, v_badge_id, 'course_completion')
        ON CONFLICT (user_id, badge_id) DO NOTHING;
      END IF;
    END IF;
  END LOOP;
  
  -- Check and award certificates
  FOR v_certificate_template IN 
    SELECT * FROM certificate_templates 
    WHERE course_id = p_course_id AND is_active = true
  LOOP
    -- Check if requirements are met
    IF v_completion.completion_percentage >= COALESCE((v_certificate_template.requirements->>'completion_percentage')::decimal, 100)
       AND (v_completion.final_exam_score IS NULL OR 
            v_completion.final_exam_score >= COALESCE((v_certificate_template.requirements->>'min_final_exam_score')::decimal, 0)) THEN
      
      -- Check if certificate doesn't already exist
      IF NOT EXISTS (
        SELECT 1 FROM certificates
        WHERE user_id = p_user_id AND course_id = p_course_id
      ) THEN
        -- Award certificate
        INSERT INTO certificates (user_id, course_id, certificate_number, metadata)
        VALUES (
          p_user_id, 
          p_course_id,
          'CERT-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)),
          jsonb_build_object(
            'template_id', v_certificate_template.id,
            'completion_percentage', v_completion.completion_percentage,
            'final_exam_score', v_completion.final_exam_score,
            'completed_at', v_completion.completed_at
          )
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for user progress updates
CREATE OR REPLACE FUNCTION trigger_course_completion_check()
RETURNS trigger AS $$
BEGIN
  -- Calculate completion and auto-award achievements
  PERFORM calculate_course_completion(NEW.user_id, NEW.course_id);
  PERFORM auto_award_achievements(NEW.user_id, NEW.course_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for quiz attempts (final exams)
CREATE OR REPLACE FUNCTION trigger_quiz_completion_check()
RETURNS trigger AS $$
DECLARE
  v_course_id uuid;
BEGIN
  -- Get course_id from quiz
  SELECT course_id INTO v_course_id
  FROM quizzes
  WHERE id = NEW.quiz_id;
  
  IF v_course_id IS NOT NULL THEN
    -- Calculate completion and auto-award achievements
    PERFORM calculate_course_completion(NEW.user_id, v_course_id);
    PERFORM auto_award_achievements(NEW.user_id, v_course_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-generating course cover when AI course is created
CREATE OR REPLACE FUNCTION trigger_auto_generate_course_cover()
RETURNS trigger AS $$
BEGIN
  -- Only trigger for AI-generated courses without a thumbnail
  IF NEW.ai_generated = true AND (NEW.cover_image_url IS NULL OR NEW.cover_image_url = '') THEN
    -- Insert a generation job for the course cover
    INSERT INTO generation_jobs (type, status, input, created_by)
    VALUES (
      'course_cover_generation',
      'queued',
      jsonb_build_object(
        'course_id', NEW.id,
        'course_title', NEW.title,
        'course_description', NEW.description
      ),
      NEW.instructor_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_user_progress_completion
  AFTER INSERT OR UPDATE ON user_progress
  FOR EACH ROW
  WHEN (NEW.is_completed = true)
  EXECUTE FUNCTION trigger_course_completion_check();

CREATE TRIGGER trigger_quiz_attempt_completion
  AFTER INSERT OR UPDATE ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_quiz_completion_check();

CREATE TRIGGER trigger_course_cover_generation
  AFTER INSERT ON courses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_generate_course_cover();

-- RLS Policies for new tables

-- Badge templates policies
CREATE POLICY "Badge templates are viewable by everyone"
ON public.badge_templates FOR SELECT USING (true);

CREATE POLICY "Instructors and admins can manage badge templates"
ON public.badge_templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  )
);

-- Certificate templates policies
CREATE POLICY "Certificate templates are viewable by everyone"
ON public.certificate_templates FOR SELECT USING (true);

CREATE POLICY "Instructors and admins can manage certificate templates"
ON public.certificate_templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  )
);

-- Course completions policies
CREATE POLICY "Users can view their own course completions"
ON public.course_completions FOR SELECT
USING (
  user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Admins and instructors can view all course completions"
ON public.course_completions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  )
);

CREATE POLICY "System can manage course completions"
ON public.course_completions FOR ALL
USING (true)
WITH CHECK (true);

-- Create default templates for existing courses
INSERT INTO badge_templates (name, description, course_id, design_config, requirements)
SELECT 
  'Conclusão de ' || title,
  'Badge por completar o curso ' || title,
  id,
  '{"background_color": "#1e40af", "text_color": "#ffffff", "border_style": "solid", "icon": "trophy"}'::jsonb,
  '{"completion_percentage": 100}'::jsonb
FROM courses
WHERE is_published = true
ON CONFLICT DO NOTHING;

INSERT INTO certificate_templates (name, description, course_id, design_config, content_template, requirements)
SELECT 
  'Certificado de ' || title,
  'Certificado de conclusão do curso ' || title,
  id,
  '{"template_style": "modern", "primary_color": "#1e40af", "secondary_color": "#64748b", "logo_position": "top-center"}'::jsonb,
  'Certificamos que {student_name} concluiu com sucesso o curso "' || title || '" com {completion_percentage}% de aproveitamento.',
  '{"completion_percentage": 100, "min_final_exam_score": 70}'::jsonb
FROM courses
WHERE is_published = true
ON CONFLICT DO NOTHING;