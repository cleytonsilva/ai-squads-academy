
CREATE TABLE quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER,
  course_id INTEGER,
  title TEXT NOT NULL,
  is_final_exam BOOLEAN DEFAULT 0,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quiz_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice',
  correct_answer TEXT NOT NULL,
  options TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria TEXT,
  points_required INTEGER,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
