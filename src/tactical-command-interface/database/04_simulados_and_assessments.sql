-- Tabela de simulados
CREATE TABLE simulados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) CHECK (type IN ('ENEM', 'Vestibular', 'Específico', 'Área')),
    difficulty VARCHAR(20) CHECK (difficulty IN ('Baixo', 'Médio', 'Alto')),
    duration_minutes INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    max_score INTEGER DEFAULT 1000,
    subjects TEXT[], -- Array de matérias
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tentativas de simulados
CREATE TABLE simulado_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    simulado_id UUID REFERENCES simulados(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluido', 'abandonado')),
    score INTEGER,
    correct_answers INTEGER DEFAULT 0,
    total_questions INTEGER,
    time_spent_minutes INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de questões
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(255),
    difficulty VARCHAR(20) CHECK (difficulty IN ('Baixo', 'Médio', 'Alto')),
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'essay')),
    options JSONB, -- Para questões de múltipla escolha
    correct_answer TEXT,
    explanation TEXT,
    points INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de questões do simulado
CREATE TABLE simulado_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulado_id UUID REFERENCES simulados(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    points INTEGER DEFAULT 1,
    UNIQUE(simulado_id, question_id)
);

-- Tabela de respostas do usuário
CREATE TABLE user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES simulado_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    user_answer TEXT,
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    time_spent_seconds INTEGER,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

-- Índices para otimização
CREATE INDEX idx_simulados_type ON simulados(type);
CREATE INDEX idx_simulados_difficulty ON simulados(difficulty);
CREATE INDEX idx_simulados_active ON simulados(is_active);
CREATE INDEX idx_simulado_attempts_user_id ON simulado_attempts(user_id);
CREATE INDEX idx_simulado_attempts_simulado_id ON simulado_attempts(simulado_id);
CREATE INDEX idx_simulado_attempts_status ON simulado_attempts(status);
CREATE INDEX idx_simulado_attempts_score ON simulado_attempts(score);
CREATE INDEX idx_questions_subject ON questions(subject);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_active ON questions(is_active);
CREATE INDEX idx_simulado_questions_simulado_id ON simulado_questions(simulado_id);
CREATE INDEX idx_simulado_questions_order ON simulado_questions(order_index);
CREATE INDEX idx_user_answers_attempt_id ON user_answers(attempt_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);
