-- Migração para adicionar cursos de exemplo

-- Inserir cursos de exemplo
INSERT INTO courses (
  title,
  description,
  content,
  level,
  duration_hours,
  price,
  is_published,
  category,
  tags,
  learning_objectives,
  status,
  difficulty_level,
  estimated_duration,
  is_active
) VALUES 
(
  'Fundamentos de Programação',
  'Aprenda os conceitos básicos de programação com exemplos práticos e exercícios interativos.',
  'Este curso aborda variáveis, estruturas de controle, funções e muito mais.',
  'beginner',
  40,
  0,
  true,
  'Programação',
  ARRAY['programação', 'lógica', 'algoritmos'],
  ARRAY['Entender conceitos básicos de programação', 'Criar algoritmos simples', 'Resolver problemas lógicos'],
  'published',
  'beginner',
  2400, -- 40 horas em minutos
  true
),
(
  'Desenvolvimento Web com React',
  'Domine o React e crie aplicações web modernas e responsivas.',
  'Curso completo de React incluindo hooks, context API, roteamento e muito mais.',
  'intermediate',
  60,
  0,
  true,
  'Desenvolvimento Web',
  ARRAY['react', 'javascript', 'frontend'],
  ARRAY['Criar componentes React', 'Gerenciar estado da aplicação', 'Implementar roteamento'],
  'published',
  'intermediate',
  3600, -- 60 horas em minutos
  true
),
(
  'Banco de Dados e SQL',
  'Aprenda a trabalhar com bancos de dados relacionais e linguagem SQL.',
  'Curso abrangente sobre modelagem de dados, consultas SQL e otimização.',
  'intermediate',
  35,
  0,
  true,
  'Banco de Dados',
  ARRAY['sql', 'database', 'postgresql'],
  ARRAY['Modelar bancos de dados', 'Escrever consultas SQL eficientes', 'Otimizar performance'],
  'published',
  'intermediate',
  2100, -- 35 horas em minutos
  true
),
(
  'DevOps e Deploy',
  'Aprenda a fazer deploy de aplicações e gerenciar infraestrutura.',
  'Curso sobre Docker, CI/CD, monitoramento e boas práticas de DevOps.',
  'advanced',
  50,
  0,
  true,
  'DevOps',
  ARRAY['docker', 'ci/cd', 'deploy'],
  ARRAY['Configurar pipelines CI/CD', 'Usar Docker e containers', 'Monitorar aplicações'],
  'published',
  'advanced',
  3000, -- 50 horas em minutos
  true
),
(
  'Inteligência Artificial Básica',
  'Introdução aos conceitos fundamentais de IA e Machine Learning.',
  'Curso introdutório sobre IA, algoritmos de ML e aplicações práticas.',
  'intermediate',
  45,
  0,
  true,
  'Inteligência Artificial',
  ARRAY['ai', 'machine learning', 'python'],
  ARRAY['Entender conceitos de IA', 'Implementar algoritmos básicos', 'Aplicar ML em projetos'],
  'published',
  'intermediate',
  2700, -- 45 horas em minutos
  true
),
(
  'Segurança da Informação',
  'Aprenda sobre segurança cibernética e proteção de dados.',
  'Curso sobre criptografia, autenticação, autorização e boas práticas de segurança.',
  'advanced',
  30,
  0,
  true,
  'Segurança',
  ARRAY['security', 'cybersecurity', 'encryption'],
  ARRAY['Implementar medidas de segurança', 'Entender criptografia', 'Proteger aplicações'],
  'published',
  'advanced',
  1800, -- 30 horas em minutos
  true
);

-- Garantir que os cursos estejam ativos e publicados
UPDATE courses SET 
  is_active = true,
  is_published = true,
  status = 'published'
WHERE is_active IS NULL OR is_published IS NULL OR status != 'published';