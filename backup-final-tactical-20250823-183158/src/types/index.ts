// Tipos centralizados da plataforma AI Squads Academy
// Este arquivo consolida todos os tipos necessários para a aplicação

import { Database } from '@/integrations/supabase/types';

// ============================================================================
// TIPOS BASE DO SUPABASE
// ============================================================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// ============================================================================
// TIPOS DE USUÁRIO E PERFIL
// ============================================================================

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'student' | 'instructor' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  social_links?: Record<string, string>;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TIPOS DE CURSO
// ============================================================================

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type ModuleType = 'content' | 'quiz' | 'assignment' | 'final_exam';

export interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'multiple_select';
  points?: number;
}

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

export interface ModuleContent {
  html: string;
  summary?: string;
  estimated_reading_time?: number;
  interactive_elements?: any[];
}

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

// ============================================================================
// TIPOS DE PROGRESSO E TENTATIVAS
// ============================================================================

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

// ============================================================================
// TIPOS DE BADGES E GAMIFICAÇÃO
// ============================================================================

export type BadgeType = 'achievement' | 'completion' | 'streak' | 'special' | 'milestone';

export interface BadgeTemplate {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  color?: string;
  badge_type: BadgeType;
  criteria: Record<string, any>;
  xp_reward: number;
  is_active: boolean;
  course_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: BadgeTemplate;
}

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

// ============================================================================
// TIPOS DE DESAFIOS
// ============================================================================

export type ChallengeType = 'daily' | 'weekly' | 'monthly' | 'special' | 'community';
export type ChallengeStatus = 'active' | 'completed' | 'expired' | 'draft';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: ChallengeType;
  status: ChallengeStatus;
  start_date: string;
  end_date: string;
  requirements: Record<string, any>;
  rewards: {
    xp: number;
    badges?: string[];
    certificates?: string[];
  };
  max_participants?: number;
  current_participants: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChallengeParticipation {
  id: string;
  user_id: string;
  challenge_id: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'failed';
  progress: Record<string, any>;
  completed_at?: string;
  enrolled_at: string;
  challenge?: Challenge;
}

// ============================================================================
// TIPOS DE CERTIFICADOS
// ============================================================================

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  template_id?: string;
  certificate_url: string;
  issued_at: string;
  verification_code: string;
  metadata?: Record<string, any>;
  user?: User;
  course?: Course;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  template_data: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TIPOS DE TRACKS E MISSÕES
// ============================================================================

export interface Track {
  id: string;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Mission {
  id: string;
  track_id: string;
  title: string;
  description?: string;
  requirements: Record<string, any>;
  rewards: Record<string, any>;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  track?: Track;
}

// ============================================================================
// TIPOS DE NOTIFICAÇÕES
// ============================================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'achievement';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  action_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  expires_at?: string;
}

// ============================================================================
// TIPOS DE ANOTAÇÕES
// ============================================================================

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

// ============================================================================
// TIPOS PARA GERAÇÃO DE CURSOS COM IA
// ============================================================================

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

export interface AIGeneratedFinalExam {
  title: string;
  description?: string;
  questions: QuizQuestion[];
}

export interface AICourseMaterial {
  title: string;
  description: string;
  target_audience: string;
  estimated_minutes: number;
  modules: AIGeneratedModule[];
  final_exam: AIGeneratedFinalExam;
}

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

// ============================================================================
// TIPOS PARA CHAT IA
// ============================================================================

export interface AIChatConfig {
  enabled: boolean;
  model: string;
  context_limit: number;
  response_limit: number;
  allowed_topics: string[];
  blocked_during_quiz: boolean;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  module_context?: string;
}

export interface AIChatSession {
  id: string;
  user_id: string;
  course_id: string;
  module_id?: string;
  messages: AIChatMessage[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TIPOS AUXILIARES E COMPOSTOS
// ============================================================================

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

export type UserWithProfile = User & {
  profile?: UserProfile;
};

export type ChallengeWithParticipation = Challenge & {
  userParticipation?: ChallengeParticipation;
};

// ============================================================================
// TIPOS PARA FORMULÁRIOS
// ============================================================================

export type CreateCourseForm = Omit<Course, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCourseForm = Partial<CreateCourseForm>;
export type CreateModuleForm = Omit<CourseModule, 'id' | 'created_at' | 'updated_at'>;
export type UpdateModuleForm = Partial<CreateModuleForm>;
export type CreateChallengeForm = Omit<Challenge, 'id' | 'created_at' | 'updated_at' | 'current_participants'>;
export type UpdateChallengeForm = Partial<CreateChallengeForm>;
export type CreateBadgeForm = Omit<BadgeTemplate, 'id' | 'created_at' | 'updated_at'>;
export type UpdateBadgeForm = Partial<CreateBadgeForm>;

// ============================================================================
// TIPOS PARA RESPOSTAS DE API
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// ============================================================================
// TIPOS PARA ESTADO GLOBAL (ZUSTAND)
// ============================================================================

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

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export interface BadgeState {
  badges: BadgeTemplate[];
  userBadges: UserBadge[];
  loading: boolean;
  fetchBadges: () => Promise<void>;
  fetchUserBadges: (userId: string) => Promise<void>;
  createBadge: (badge: CreateBadgeForm) => Promise<void>;
  updateBadge: (id: string, updates: UpdateBadgeForm) => Promise<void>;
  deleteBadge: (id: string) => Promise<void>;
}

export interface ChallengeState {
  challenges: Challenge[];
  userParticipations: ChallengeParticipation[];
  loading: boolean;
  fetchChallenges: () => Promise<void>;
  fetchUserParticipations: (userId: string) => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<void>;
  updateProgress: (participationId: string, progress: Record<string, any>) => Promise<void>;
}

// ============================================================================
// TIPOS PARA HOOKS CUSTOMIZADOS
// ============================================================================

export interface UseBadgesReturn {
  badges: BadgeTemplate[];
  userBadges: UserBadge[];
  loading: boolean;
  error: string | null;
  createBadge: (badge: CreateBadgeForm) => Promise<void>;
  updateBadge: (id: string, updates: UpdateBadgeForm) => Promise<void>;
  deleteBadge: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export interface UseChallengesReturn {
  challenges: Challenge[];
  userParticipations: ChallengeParticipation[];
  loading: boolean;
  error: string | null;
  joinChallenge: (challengeId: string) => Promise<void>;
  leaveChallenge: (challengeId: string) => Promise<void>;
  updateProgress: (participationId: string, progress: Record<string, any>) => Promise<void>;
  refetch: () => Promise<void>;
}

export interface UseCoursesReturn {
  courses: Course[];
  loading: boolean;
  error: string | null;
  createCourse: (course: CreateCourseForm) => Promise<Course>;
  updateCourse: (id: string, updates: UpdateCourseForm) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  generateCourse: (request: GenerateCourseRequest) => Promise<GenerationJob>;
  refetch: () => Promise<void>;
}

// ============================================================================
// TIPOS PARA COMPONENTES ADMINISTRATIVOS
// ============================================================================

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalCertificates: number;
  totalBadges: number;
  activeUsers: number;
  coursesCompleted: number;
  averageProgress: number;
}

export interface UserManagementData {
  users: UserWithProfile[];
  total: number;
  loading: boolean;
  filters: {
    role?: string;
    status?: string;
    search?: string;
  };
}

export interface CourseManagementData {
  courses: CourseWithProgress[];
  total: number;
  loading: boolean;
  filters: {
    status?: CourseStatus;
    level?: DifficultyLevel;
    search?: string;
  };
}

// ============================================================================
// TIPOS PARA VALIDAÇÃO E SCHEMAS
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  loading: boolean;
  touched: Record<keyof T, boolean>;
}

// ============================================================================
// TIPOS PARA COMPATIBILIDADE
// ============================================================================

// Aliases para compatibilidade com código existente
export type GenerateCourseRequestType = GenerateCourseRequest;
export type AICourseMaterialType = AICourseMaterial;
export type BadgeTemplateType = BadgeTemplate;
export type ChallengeType = Challenge;
export type UserType = User;
export type CourseType = Course;
export type ModuleType = CourseModule;
export type QuizType = Quiz;
export type CertificateType = Certificate;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard para verificar se um objeto é um User válido
 */
export function isUser(obj: any): obj is User {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    ['student', 'instructor', 'admin'].includes(obj.role);
}

/**
 * Type guard para verificar se um objeto é um Course válido
 */
export function isCourse(obj: any): obj is Course {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    ['beginner', 'intermediate', 'advanced'].includes(obj.level) &&
    ['draft', 'published', 'archived'].includes(obj.status);
}

/**
 * Type guard para verificar se um objeto é um Challenge válido
 */
export function isChallenge(obj: any): obj is Challenge {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    ['daily', 'weekly', 'monthly', 'special', 'community'].includes(obj.challenge_type) &&
    ['active', 'completed', 'expired', 'draft'].includes(obj.status);
}

/**
 * Type guard para verificar se um objeto é um BadgeTemplate válido
 */
export function isBadgeTemplate(obj: any): obj is BadgeTemplate {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    ['achievement', 'completion', 'streak', 'special', 'milestone'].includes(obj.badge_type) &&
    typeof obj.is_active === 'boolean';
}

/**
 * Type guard para verificar se um objeto é um Certificate válido
 */
export function isCertificate(obj: any): obj is Certificate {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.user_id === 'string' &&
    typeof obj.course_id === 'string' &&
    typeof obj.certificate_url === 'string' &&
    typeof obj.verification_code === 'string';
}

/**
 * Type guard para verificar se um objeto é um Quiz válido
 */
export function isQuiz(obj: any): obj is Quiz {
  return obj &&
    typeof obj.title === 'string' &&
    Array.isArray(obj.questions) &&
    obj.questions.every((q: any) => isQuizQuestion(q));
}

/**
 * Type guard para verificar se um objeto é uma QuizQuestion válida
 */
export function isQuizQuestion(obj: any): obj is QuizQuestion {
  return obj &&
    typeof obj.question === 'string' &&
    Array.isArray(obj.options) &&
    typeof obj.correct_answer === 'string' &&
    ['multiple_choice', 'true_false', 'short_answer', 'multiple_select'].includes(obj.question_type);
}

/**
 * Type guard para verificar se um objeto é um ApiResponse válido
 */
export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return obj &&
    (obj.data !== undefined || obj.error !== undefined || obj.message !== undefined);
}

/**
 * Type guard para verificar se um objeto é um PaginatedResponse válido
 */
export function isPaginatedResponse<T>(obj: any): obj is PaginatedResponse<T> {
  return obj &&
    Array.isArray(obj.data) &&
    typeof obj.total === 'number' &&
    typeof obj.page === 'number' &&
    typeof obj.limit === 'number' &&
    typeof obj.hasMore === 'boolean';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Função para validar e converter dados do Supabase para tipos tipados
 */
export function validateAndConvert<T>(
  data: any,
  validator: (obj: any) => obj is T
): T | null {
  if (validator(data)) {
    return data;
  }
  console.warn('Dados inválidos recebidos:', data);
  return null;
}

/**
 * Função para validar array de dados
 */
export function validateArray<T>(
  data: any[],
  validator: (obj: any) => obj is T
): T[] {
  return data.filter(validator);
}

// ============================================================================
// EXPORTS PARA FACILITAR IMPORTAÇÃO
// ============================================================================

// Re-export dos tipos do Supabase para facilitar o uso
export type { Database } from '@/integrations/supabase/types';

// Export default para importação simplificada
export default {
  // Tipos principais
  User,
  Course,
  CourseModule,
  Quiz,
  QuizQuestion,
  Badge: BadgeTemplate,
  Challenge,
  Certificate,
  
  // Tipos de estado
  CourseState,
  AuthState,
  BadgeState,
  ChallengeState,
  
  // Tipos de formulário
  CreateCourseForm,
  UpdateCourseForm,
  CreateBadgeForm,
  UpdateBadgeForm,
  
  // Tipos de API
  ApiResponse,
  PaginatedResponse,
  ApiError,
  
  // Type guards
  isUser,
  isCourse,
  isChallenge,
  isBadgeTemplate,
  isCertificate,
  isQuiz,
  isQuizQuestion,
  isApiResponse,
  isPaginatedResponse,
  
  // Utility functions
  validateAndConvert,
  validateArray,
};