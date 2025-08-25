// Tipos para o sistema de cursos da plataforma Esquads

/**
 * Tipos de dificuldade dos cursos
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Status do curso
 */
export type CourseStatus = 'draft' | 'published' | 'archived';

/**
 * Tipo de módulo
 */
export type ModuleType = 'content' | 'quiz' | 'assignment' | 'final_exam';

/**
 * Interface para questões de quiz
 */
export interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'multiple_select';
  points?: number;
}

/**
 * Interface para quiz
 */
export interface Quiz {
  id?: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  passing_score?: number;
  time_limit_minutes?: number;
  max_attempts?: number;
  is_active?: boolean;
  order_index?: number;
}

/**
 * Interface para conteúdo do módulo
 */
export interface ModuleContent {
  html: string;
  summary?: string;
  estimated_reading_time?: number;
  interactive_elements?: any[];
}

/**
 * Interface para módulo do curso
 */
export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  module_type: ModuleType;
  content_jsonb: ModuleContent;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  quiz?: Quiz;
}

/**
 * Interface para curso completo
 */
export interface Course {
  id: string;
  title: string;
  description?: string;
  content?: string;
  instructor_id?: string;
  level: DifficultyLevel;
  duration_hours?: number;
  price?: number;
  is_published: boolean;
  cover_image_url?: string;
  category?: string;
  tags?: string[];
  prerequisites?: string[];
  learning_objectives?: string[];
  created_at: string;
  updated_at: string;
  ai_generated: boolean;
  status: CourseStatus;
  difficulty_level: DifficultyLevel;
  estimated_duration: number;
  modules?: CourseModule[];
}

/**
 * Interface para progresso do usuário no curso
 */
export interface UserCourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  current_module_id?: string;
  progress_percentage: number;
  completed_modules: string[];
  started_at: string;
  last_accessed_at: string;
  completed_at?: string;
  total_xp_earned: number;
  quiz_attempts: Record<string, number>;
}

/**
 * Interface para tentativa de quiz
 */
export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  course_id: string;
  module_id?: string;
  answers: Record<string, any>;
  score: number;
  max_score: number;
  passed: boolean;
  attempt_number: number;
  started_at: string;
  completed_at?: string;
  xp_earned: number;
}

/**
 * Interface para anotações do usuário
 */
export interface UserNote {
  id: string;
  user_id: string;
  course_id: string;
  module_id?: string;
  content: string;
  position?: {
    x: number;
    y: number;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Interface para certificado
 */
export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  certificate_url: string;
  issued_at: string;
  verification_code: string;
}

// Tipos para geração de cursos com IA

/**
 * Interface para requisição de geração de curso
 */
export interface GenerateCourseRequest {
  title: string;
  description: string;
  target_audience: string;
  difficulty_level: DifficultyLevel;
  num_modules?: number;
  topic?: string;
  include_final_exam?: boolean;
  final_exam_difficulty?: DifficultyLevel;
  final_exam_options?: number;
  final_exam_questions?: number;
  tone?: string;
  module_length_min?: number;
  module_length_max?: number;
}

/**
 * Interface para módulo gerado pela IA
 */
export interface AIGeneratedModule {
  title: string;
  summary: string;
  content_html: string;
  duration_minutes?: number;
  quiz: {
    title: string;
    description: string;
    questions: QuizQuestion[];
  };
}

/**
 * Interface para prova final gerada pela IA
 */
export interface AIGeneratedFinalExam {
  title: string;
  description?: string;
  questions: QuizQuestion[];
}

/**
 * Interface para material do curso gerado pela IA
 */
export interface AICourseMaterial {
  title: string;
  description: string;
  target_audience: string;
  estimated_minutes: number;
  modules: AIGeneratedModule[];
  final_exam: AIGeneratedFinalExam;
}

/**
 * Interface para job de geração
 */
export interface GenerationJob {
  id: string;
  type: 'ai_generate_course' | 'ai_extend_module' | 'ai_generate_certifications';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

/**
 * Interface para estado do curso no Zustand
 */
export interface CourseState {
  // Estado atual
  currentCourse: Course | null;
  currentModule: CourseModule | null;
  userProgress: UserCourseProgress | null;
  
  // Loading states
  loading: boolean;
  moduleLoading: boolean;
  
  // Dados
  courses: Course[];
  modules: CourseModule[];
  userNotes: UserNote[];
  
  // Actions
  setCourse: (course: Course) => void;
  setCurrentModule: (module: CourseModule) => void;
  updateProgress: (progress: Partial<UserCourseProgress>) => void;
  addNote: (note: Omit<UserNote, 'id' | 'created_at' | 'updated_at'>) => void;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
  completeModule: (moduleId: string) => void;
  submitQuizAttempt: (attempt: Omit<QuizAttempt, 'id' | 'created_at'>) => void;
  
  // Fetch functions
  fetchCourse: (courseId: string) => Promise<void>;
  fetchUserProgress: (courseId: string) => Promise<void>;
  fetchUserNotes: (courseId: string) => Promise<void>;
}

/**
 * Interface para configurações do chat IA
 */
export interface AIChatConfig {
  enabled: boolean;
  model: string;
  context_limit: number;
  response_limit: number;
  allowed_topics: string[];
  blocked_during_quiz: boolean;
}

/**
 * Interface para mensagem do chat IA
 */
export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  module_context?: string;
}

/**
 * Interface para sessão do chat IA
 */
export interface AIChatSession {
  id: string;
  user_id: string;
  course_id: string;
  module_id?: string;
  messages: AIChatMessage[];
  created_at: string;
  updated_at: string;
}

// Tipos auxiliares
export type CourseWithProgress = Course & {
  userProgress?: UserCourseProgress;
  completionPercentage?: number;
};

export type ModuleWithQuiz = CourseModule & {
  quiz?: Quiz;
  userAttempts?: QuizAttempt[];
  isCompleted?: boolean;
  isLocked?: boolean;
};

// Tipos para formulários
export type CreateCourseForm = Omit<Course, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCourseForm = Partial<CreateCourseForm>;
export type CreateModuleForm = Omit<CourseModule, 'id' | 'created_at' | 'updated_at'>;
export type UpdateModuleForm = Partial<CreateModuleForm>;

// Tipos para API responses
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Tipos para gamificação
export interface XPReward {
  action: 'module_complete' | 'quiz_pass' | 'quiz_perfect' | 'course_complete';
  points: number;
  description: string;
}

export interface UserXP {
  user_id: string;
  course_id: string;
  total_xp: number;
  level: number;
  xp_to_next_level: number;
  achievements: string[];
}

// Tipos para compatibilidade com código existente
export type GenerateCourseRequestType = GenerateCourseRequest;
export type AICourseMaterialType = AICourseMaterial;