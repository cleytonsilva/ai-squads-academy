-- Migração de Otimização de Performance do Banco de Dados
-- Data: 2025-08-28
-- Descrição: Adiciona índices estratégicos e otimiza políticas RLS para melhor performance

-- =============================================
-- ÍNDICES DE PERFORMANCE
-- =============================================

-- Índices para tabela courses (consultas frequentes)
CREATE INDEX IF NOT EXISTS idx_courses_instructor_published 
  ON courses(instructor_id, is_published, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_courses_published_created 
  ON courses(is_published, created_at DESC) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_courses_title_search 
  ON courses USING gin(to_tsvector('portuguese', title || ' ' || COALESCE(description, '')));

-- Índices para tabela modules (navegação de cursos)
CREATE INDEX IF NOT EXISTS idx_modules_course_order 
  ON modules(course_id, order_index);

CREATE INDEX IF NOT EXISTS idx_modules_course_published 
  ON modules(course_id, is_published);

-- Índices para tabela user_progress (dashboard e progresso)
CREATE INDEX IF NOT EXISTS idx_user_progress_user_course 
  ON user_progress(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_updated 
  ON user_progress(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_progress_completion 
  ON user_progress(user_id, completion_percentage) WHERE completion_percentage >= 100;

-- Índices para tabela quiz_attempts (avaliações)
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz 
  ON quiz_attempts(user_id, quiz_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_passed 
  ON quiz_attempts(user_id, is_passed, created_at DESC) WHERE is_passed = true;

-- Índices para tabela user_badges (conquistas)
CREATE INDEX IF NOT EXISTS idx_user_badges_user_awarded 
  ON user_badges(user_id, awarded_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_badges_badge_awarded 
  ON user_badges(badge_id, awarded_at DESC);

-- Índices para tabela certificates (certificados)
CREATE INDEX IF NOT EXISTS idx_certificates_user_issued 
  ON certificates(user_id, issued_at DESC);

CREATE INDEX IF NOT EXISTS idx_certificates_course_issued 
  ON certificates(course_id, issued_at DESC);

-- Índices para tabela generation_jobs (geração de IA)
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status_created 
  ON generation_jobs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_type 
  ON generation_jobs(created_by, type, created_at DESC);

-- Índices para tabela profiles (usuários)
CREATE INDEX IF NOT EXISTS idx_profiles_role_created 
  ON profiles(role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_display_name 
  ON profiles(display_name) WHERE display_name IS NOT NULL;

-- =============================================
-- OTIMIZAÇÃO DE POLÍTICAS RLS
-- =============================================

-- Otimizar política de courses para melhor performance
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
CREATE POLICY "Courses are viewable by everyone" ON courses
  FOR SELECT USING (
    is_published = true OR 
    instructor_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1) OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'instructor'))
  );

-- Otimizar política de modules para evitar subconsultas desnecessárias
DROP POLICY IF EXISTS "Modules are viewable if course is accessible" ON modules;
CREATE POLICY "Modules are viewable if course is accessible" ON modules
  FOR SELECT USING (
    course_id IN (
      SELECT id FROM courses 
      WHERE is_published = true OR 
            instructor_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'instructor'))
  );

-- Otimizar política de user_progress
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
CREATE POLICY "Users can view their own progress" ON user_progress
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'instructor'))
  );

-- =============================================
-- ESTATÍSTICAS E ANÁLISE
-- =============================================

-- Atualizar estatísticas das tabelas para o otimizador de consultas
ANALYZE courses;
ANALYZE modules;
ANALYZE user_progress;
ANALYZE quiz_attempts;
ANALYZE user_badges;
ANALYZE certificates;
ANALYZE generation_jobs;
ANALYZE profiles;

-- =============================================
-- FUNÇÕES DE PERFORMANCE
-- =============================================

-- Função para calcular estatísticas de curso de forma otimizada
CREATE OR REPLACE FUNCTION get_course_stats(course_id_param UUID)
RETURNS TABLE (
  total_enrollments BIGINT,
  completed_enrollments BIGINT,
  average_completion NUMERIC,
  total_certificates BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(up.user_id) as total_enrollments,
    COUNT(up.user_id) FILTER (WHERE up.completion_percentage >= 100) as completed_enrollments,
    COALESCE(AVG(up.completion_percentage), 0) as average_completion,
    COUNT(c.id) as total_certificates
  FROM user_progress up
  LEFT JOIN certificates c ON c.course_id = course_id_param AND c.user_id = up.user_id
  WHERE up.course_id = course_id_param;
END;
$$ LANGUAGE plpgsql STABLE;

-- Função para buscar cursos com filtros otimizada
CREATE OR REPLACE FUNCTION search_courses(
  search_term TEXT DEFAULT NULL,
  instructor_filter UUID DEFAULT NULL,
  published_only BOOLEAN DEFAULT true,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  instructor_id UUID,
  is_published BOOLEAN,
  created_at TIMESTAMPTZ,
  enrollment_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.instructor_id,
    c.is_published,
    c.created_at,
    COALESCE(stats.enrollment_count, 0) as enrollment_count
  FROM courses c
  LEFT JOIN (
    SELECT 
      course_id,
      COUNT(*) as enrollment_count
    FROM user_progress
    GROUP BY course_id
  ) stats ON stats.course_id = c.id
  WHERE 
    (NOT published_only OR c.is_published = true) AND
    (instructor_filter IS NULL OR c.instructor_id = instructor_filter) AND
    (search_term IS NULL OR 
     c.title ILIKE '%' || search_term || '%' OR 
     c.description ILIKE '%' || search_term || '%')
  ORDER BY c.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =============================================

COMMENT ON INDEX idx_courses_instructor_published IS 'Otimiza consultas de cursos por instrutor e status de publicação';
COMMENT ON INDEX idx_user_progress_user_course IS 'Otimiza consultas de progresso por usuário e curso';
COMMENT ON INDEX idx_quiz_attempts_user_quiz IS 'Otimiza consultas de tentativas de quiz por usuário';
COMMENT ON FUNCTION get_course_stats IS 'Função otimizada para calcular estatísticas de curso';
COMMENT ON FUNCTION search_courses IS 'Função otimizada para busca de cursos com filtros';

-- Verificação final
DO $$
BEGIN
  RAISE NOTICE 'Migração de otimização de performance concluída com sucesso!';
  RAISE NOTICE 'Índices criados: %', (
    SELECT COUNT(*) 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
  );
END $$;