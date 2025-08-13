-- Sistema de Automação de Cursos
-- Criação de tabelas para templates de badges e certificados, e sistema de automação

-- Tabela para templates de badges
CREATE TABLE IF NOT EXISTS badge_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  completion_percentage INTEGER NOT NULL DEFAULT 100 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  design_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para templates de certificados
CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  design_config JSONB NOT NULL DEFAULT '{}',
  content_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para rastrear conclusões de curso
CREATE TABLE IF NOT EXISTS course_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  final_exam_score DECIMAL(5,2),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Habilitar RLS
ALTER TABLE badge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_completions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para badge_templates (idempotentes)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'badge_templates' AND policyname = 'Badge templates são visíveis para todos'
  ) THEN
    EXECUTE 'CREATE POLICY "Badge templates são visíveis para todos" ON public.badge_templates FOR SELECT USING (true)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'badge_templates' AND policyname = 'Apenas admins e instrutores podem gerenciar badge templates'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "Apenas admins e instrutores podem gerenciar badge templates" ON public.badge_templates
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('admin', 'instructor')
        )
      )
    $SQL$;
  END IF;
END $$;

-- Políticas RLS para certificate_templates (idempotentes)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'certificate_templates' AND policyname = 'Certificate templates são visíveis para todos'
  ) THEN
    EXECUTE 'CREATE POLICY "Certificate templates são visíveis para todos" ON public.certificate_templates FOR SELECT USING (true)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'certificate_templates' AND policyname = 'Apenas admins e instrutores podem gerenciar certificate templates'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "Apenas admins e instrutores podem gerenciar certificate templates" ON public.certificate_templates
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('admin', 'instructor')
        )
      )
    $SQL$;
  END IF;
END $$;

-- Políticas RLS para course_completions (idempotentes)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'course_completions' AND policyname = 'Usuários podem ver suas próprias conclusões'
  ) THEN
    EXECUTE 'CREATE POLICY "Usuários podem ver suas próprias conclusões" ON public.course_completions FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'course_completions' AND policyname = 'Usuários podem inserir suas próprias conclusões'
  ) THEN
    EXECUTE 'CREATE POLICY "Usuários podem inserir suas próprias conclusões" ON public.course_completions FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'course_completions' AND policyname = 'Usuários podem atualizar suas próprias conclusões'
  ) THEN
    EXECUTE 'CREATE POLICY "Usuários podem atualizar suas próprias conclusões" ON public.course_completions FOR UPDATE USING (auth.uid() = user_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'course_completions' AND policyname = 'Admins e instrutores podem ver todas as conclusões'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "Admins e instrutores podem ver todas as conclusões" ON public.course_completions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('admin', 'instructor')
        )
      )
    $SQL$;
  END IF;
END $$;

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist and recreate them (idempotent)
DROP TRIGGER IF EXISTS update_badge_templates_updated_at ON badge_templates;
CREATE TRIGGER update_badge_templates_updated_at
  BEFORE UPDATE ON badge_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_certificate_templates_updated_at ON certificate_templates;
CREATE TRIGGER update_certificate_templates_updated_at
  BEFORE UPDATE ON certificate_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_completions_updated_at ON course_completions;
CREATE TRIGGER update_course_completions_updated_at
  BEFORE UPDATE ON course_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular progresso do curso
CREATE OR REPLACE FUNCTION calculate_course_completion(p_user_id UUID, p_course_id UUID)
RETURNS TABLE(
  completion_percentage DECIMAL(5,2),
  final_exam_score DECIMAL(5,2)
) AS $$
DECLARE
  total_modules INTEGER;
  completed_modules INTEGER;
  exam_score DECIMAL(5,2);
  completion_pct DECIMAL(5,2);
BEGIN
  -- Contar total de módulos do curso
  SELECT COUNT(*) INTO total_modules
  FROM modules
  WHERE course_id = p_course_id;
  
  -- Contar módulos completados pelo usuário
  SELECT COUNT(*) INTO completed_modules
  FROM user_progress
  WHERE user_id = p_user_id 
    AND course_id = p_course_id 
    AND completed = true;
  
  -- Calcular porcentagem de conclusão
  IF total_modules > 0 THEN
    completion_pct := (completed_modules::DECIMAL / total_modules::DECIMAL) * 100;
  ELSE
    completion_pct := 0;
  END IF;
  
  -- Buscar pontuação do exame final (quiz com is_final_exam = true)
  SELECT qa.score INTO exam_score
  FROM quiz_attempts qa
  JOIN quizzes q ON qa.quiz_id = q.id
  WHERE qa.user_id = p_user_id
    AND q.course_id = p_course_id
    AND q.is_final_exam = true
    AND qa.completed = true
  ORDER BY qa.completed_at DESC
  LIMIT 1;
  
  RETURN QUERY SELECT completion_pct, exam_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para conceder conquistas automaticamente
CREATE OR REPLACE FUNCTION auto_award_achievements(p_user_id UUID, p_course_id UUID)
RETURNS VOID AS $$
DECLARE
  completion_data RECORD;
  badge_template RECORD;
  cert_template RECORD;
BEGIN
  -- Obter dados de conclusão do curso
  SELECT * INTO completion_data
  FROM calculate_course_completion(p_user_id, p_course_id);
  
  -- Verificar e conceder badges
  FOR badge_template IN 
    SELECT * FROM badge_templates 
    WHERE course_id = p_course_id 
      AND is_active = true
      AND completion_data.completion_percentage >= completion_percentage
  LOOP
    -- Verificar se o usuário já possui este badge
    IF NOT EXISTS (
      SELECT 1 FROM user_badges 
      WHERE user_id = p_user_id 
        AND badge_template_id = badge_template.id
    ) THEN
      -- Conceder badge
      INSERT INTO user_badges (user_id, badge_template_id, awarded_at)
      VALUES (p_user_id, badge_template.id, NOW());
    END IF;
  END LOOP;
  
  -- Verificar e conceder certificados (apenas se curso 100% completo e exame final aprovado)
  IF completion_data.completion_percentage >= 100 AND 
     completion_data.final_exam_score IS NOT NULL AND 
     completion_data.final_exam_score >= 70 THEN
    
    FOR cert_template IN 
      SELECT * FROM certificate_templates 
      WHERE course_id = p_course_id 
        AND is_active = true
    LOOP
      -- Verificar se o usuário já possui este certificado
      IF NOT EXISTS (
        SELECT 1 FROM certificates 
        WHERE user_id = p_user_id 
          AND course_id = p_course_id
      ) THEN
        -- Conceder certificado
        INSERT INTO certificates (user_id, course_id, issued_at, metadata)
        VALUES (
          p_user_id, 
          p_course_id, 
          NOW(),
          jsonb_build_object(
            'template_id', cert_template.id,
            'final_exam_score', completion_data.final_exam_score,
            'completion_percentage', completion_data.completion_percentage
          )
        );
      END IF;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função de trigger para verificar conclusão do curso
CREATE OR REPLACE FUNCTION trigger_course_completion_check()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar ou inserir registro de conclusão
  INSERT INTO course_completions (user_id, course_id, completion_percentage, updated_at)
  SELECT 
    NEW.user_id,
    NEW.course_id,
    calc.completion_percentage,
    NOW()
  FROM calculate_course_completion(NEW.user_id, NEW.course_id) calc
  ON CONFLICT (user_id, course_id) 
  DO UPDATE SET 
    completion_percentage = EXCLUDED.completion_percentage,
    updated_at = NOW();
  
  -- Verificar e conceder conquistas
  PERFORM auto_award_achievements(NEW.user_id, NEW.course_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função de trigger para verificar conclusão de quiz
CREATE OR REPLACE FUNCTION trigger_quiz_completion_check()
RETURNS TRIGGER AS $$
DECLARE
  quiz_course_id UUID;
BEGIN
  -- Obter course_id do quiz
  SELECT course_id INTO quiz_course_id
  FROM quizzes
  WHERE id = NEW.quiz_id;
  
  -- Se for um exame final completado, verificar conquistas
  IF NEW.completed = true AND EXISTS (
    SELECT 1 FROM quizzes 
    WHERE id = NEW.quiz_id 
      AND is_final_exam = true
  ) THEN
    -- Atualizar conclusão do curso
    INSERT INTO course_completions (user_id, course_id, final_exam_score, updated_at)
    SELECT 
      NEW.user_id,
      quiz_course_id,
      NEW.score,
      NOW()
    ON CONFLICT (user_id, course_id) 
    DO UPDATE SET 
      final_exam_score = EXCLUDED.final_exam_score,
      updated_at = NOW();
    
    -- Verificar e conceder conquistas
    PERFORM auto_award_achievements(NEW.user_id, quiz_course_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função de trigger para gerar capa automaticamente
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

-- Criar triggers (idempotente)
DROP TRIGGER IF EXISTS trigger_user_progress_completion ON user_progress;
CREATE TRIGGER trigger_user_progress_completion
  AFTER INSERT OR UPDATE ON user_progress
  FOR EACH ROW
  WHEN (NEW.is_completed = true)
  EXECUTE FUNCTION trigger_course_completion_check();

DROP TRIGGER IF EXISTS trigger_quiz_attempt_completion ON quiz_attempts;
CREATE TRIGGER trigger_quiz_attempt_completion
  AFTER INSERT OR UPDATE ON quiz_attempts
  FOR EACH ROW
  WHEN (NEW.is_passed = true)
  EXECUTE FUNCTION trigger_quiz_completion_check();

DROP TRIGGER IF EXISTS trigger_course_cover_generation ON courses;
CREATE TRIGGER trigger_course_cover_generation
  AFTER INSERT ON courses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_generate_course_cover();

-- Inserir templates padrão para cursos existentes
INSERT INTO badge_templates (course_id, name, description, completion_percentage, design_config)
SELECT 
  id,
  'Conclusão de ' || title,
  'Badge concedido pela conclusão do curso ' || title,
  100,
  jsonb_build_object(
    'backgroundColor', '#3B82F6',
    'textColor', '#FFFFFF',
    'icon', 'trophy',
    'borderStyle', 'solid'
  )
FROM courses
WHERE NOT EXISTS (
  SELECT 1 FROM badge_templates bt WHERE bt.course_id = courses.id
);

INSERT INTO certificate_templates (course_id, name, description, design_config, content_config)
SELECT 
  id,
  'Certificado de ' || title,
  'Certificado de conclusão do curso ' || title,
  jsonb_build_object(
    'backgroundColor', '#FFFFFF',
    'textColor', '#1F2937',
    'font', 'serif',
    'borderStyle', 'elegant',
    'signatureLine', true
  ),
  jsonb_build_object(
    'title', 'Certificado de Conclusão',
    'subtitle', 'Este certificado atesta que',
    'mainText', 'concluiu com sucesso o curso',
    'footer', 'Esquads Academy - Transformando o futuro através da educação'
  )
FROM courses
WHERE NOT EXISTS (
  SELECT 1 FROM certificate_templates ct WHERE ct.course_id = courses.id
);

-- Comentários para documentação
COMMENT ON TABLE badge_templates IS 'Templates para badges que são automaticamente concedidos aos alunos';
COMMENT ON TABLE certificate_templates IS 'Templates para certificados que são automaticamente emitidos aos alunos';
COMMENT ON TABLE course_completions IS 'Rastreamento de progresso e conclusão de cursos pelos usuários';
COMMENT ON FUNCTION calculate_course_completion IS 'Calcula o progresso de conclusão de um curso para um usuário';
COMMENT ON FUNCTION auto_award_achievements IS 'Concede automaticamente badges e certificados baseado no progresso do usuário';
COMMENT ON FUNCTION trigger_course_completion_check IS 'Verifica a conclusão de um curso quando o progresso do usuário é atualizado';
COMMENT ON FUNCTION trigger_quiz_completion_check IS 'Verifica a conclusão de quiz e atualiza conquistas do usuário';
COMMENT ON FUNCTION trigger_auto_generate_course_cover IS 'Gera automaticamente a capa de cursos criados por IA';