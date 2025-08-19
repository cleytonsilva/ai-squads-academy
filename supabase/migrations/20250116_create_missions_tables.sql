-- Migração para criar tabelas missions e user_missions
-- Data: 2025-01-16
-- Descrição: Cria as tabelas necessárias para o sistema de missões

-- Função para atualizar updated_at (caso não exista)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabela missions (tarefas práticas vinculadas a cursos/módulos)
CREATE TABLE IF NOT EXISTS public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  module_id uuid,
  title text NOT NULL,
  description text,
  points integer NOT NULL DEFAULT 50,
  order_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available',
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT missions_status_check CHECK (status IN ('available', 'in_progress', 'completed', 'locked')),
  CONSTRAINT missions_points_check CHECK (points >= 0)
);

-- Habilitar RLS na tabela missions
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- Trigger para atualizar updated_at na tabela missions
DROP TRIGGER IF EXISTS update_missions_updated_at ON public.missions;
CREATE TRIGGER update_missions_updated_at
BEFORE UPDATE ON public.missions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela user_missions (progresso dos usuários nas missões)
CREATE TABLE IF NOT EXISTS public.user_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'available',
  completed_at timestamptz,
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT user_missions_status_check CHECK (status IN ('available', 'in_progress', 'completed')),
  CONSTRAINT user_missions_unique UNIQUE (user_id, mission_id)
);

-- Habilitar RLS na tabela user_missions
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

-- Trigger para atualizar updated_at na tabela user_missions
DROP TRIGGER IF EXISTS update_user_missions_updated_at ON public.user_missions;
CREATE TRIGGER update_user_missions_updated_at
BEFORE UPDATE ON public.user_missions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Foreign Keys (com verificação de existência)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_missions_course_id') THEN
        ALTER TABLE public.missions
        ADD CONSTRAINT fk_missions_course_id
        FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_missions_module_id') THEN
        ALTER TABLE public.missions
        ADD CONSTRAINT fk_missions_module_id
        FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_missions_user_id') THEN
        ALTER TABLE public.user_missions
        ADD CONSTRAINT fk_user_missions_user_id
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_missions_mission_id') THEN
        ALTER TABLE public.user_missions
        ADD CONSTRAINT fk_user_missions_mission_id
        FOREIGN KEY (mission_id) REFERENCES public.missions(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Políticas RLS para missions

-- Administradores e instrutores podem gerenciar todas as missões
DROP POLICY IF EXISTS "Instructors and admins can manage missions" ON public.missions;
CREATE POLICY "Instructors and admins can manage missions"
ON public.missions FOR ALL
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

-- Missões são visíveis se o curso for acessível
DROP POLICY IF EXISTS "Missions are viewable if course is accessible" ON public.missions;
CREATE POLICY "Missions are viewable if course is accessible"
ON public.missions FOR SELECT
USING (
  course_id IN (
    SELECT courses.id FROM courses
    WHERE courses.is_published = true
       OR courses.instructor_id IN (
         SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
       )
  )
);

-- Políticas RLS para user_missions

-- Usuários podem gerenciar suas próprias missões
DROP POLICY IF EXISTS "Users can manage their own missions" ON public.user_missions;
CREATE POLICY "Users can manage their own missions"
ON public.user_missions FOR ALL
USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- Administradores e instrutores podem ver todas as missões dos usuários
DROP POLICY IF EXISTS "Admins and instructors can view all user missions" ON public.user_missions;
CREATE POLICY "Admins and instructors can view all user missions"
ON public.user_missions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin'::user_role OR profiles.role = 'instructor'::user_role)
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_missions_course_id ON public.missions(course_id);
CREATE INDEX IF NOT EXISTS idx_missions_module_id ON public.missions(module_id);
CREATE INDEX IF NOT EXISTS idx_missions_order_index ON public.missions(order_index);
CREATE INDEX IF NOT EXISTS idx_user_missions_user_id ON public.user_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_mission_id ON public.user_missions(mission_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_status ON public.user_missions(status);

-- Comentários nas tabelas
COMMENT ON TABLE public.missions IS 'Missões práticas vinculadas a cursos e módulos';
COMMENT ON TABLE public.user_missions IS 'Progresso dos usuários nas missões';

COMMENT ON COLUMN public.missions.course_id IS 'ID do curso ao qual a missão pertence';
COMMENT ON COLUMN public.missions.module_id IS 'ID do módulo (opcional) ao qual a missão pertence';
COMMENT ON COLUMN public.missions.points IS 'Pontos XP concedidos ao completar a missão';
COMMENT ON COLUMN public.missions.order_index IS 'Ordem de exibição da missão';
COMMENT ON COLUMN public.missions.requirements IS 'Requisitos em JSON para desbloquear a missão';

COMMENT ON COLUMN public.user_missions.progress IS 'Dados de progresso da missão em JSON';
COMMENT ON COLUMN public.user_missions.completed_at IS 'Data e hora de conclusão da missão';