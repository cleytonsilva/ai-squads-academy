import z from "zod";

// User schemas
export const UserSchema = z.object({
  id: z.number(),
  mocha_user_id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.enum(['student', 'admin', 'instructor']),
  subscription_level: z.enum(['free', 'pro', 'corporate']),
  total_points: z.number().default(0),
  current_rank: z.number().nullable(),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(['student', 'admin', 'instructor']).default('student'),
  subscription_level: z.enum(['free', 'pro', 'corporate']).default('free'),
});

// Course schemas
export const CourseSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  target_audience: z.string().nullable(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  cover_image_url: z.string().nullable(),
  is_published: z.boolean().default(false),
  ai_generated: z.boolean().default(false),
  total_modules: z.number().default(0),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateCourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  target_audience: z.string().optional(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  cover_image_url: z.string().optional(),
});

export const AICourseMaterial = z.object({
  title: z.string(),
  description: z.string(),
  target_audience: z.string(),
  modules: z.array(z.object({
    title: z.string(),
    content: z.string(),
    duration_minutes: z.number(),
    quiz: z.object({
      title: z.string(),
      questions: z.array(z.object({
        question_text: z.string(),
        options: z.array(z.string()),
        correct_answer: z.string(),
        points: z.number().default(1),
      })),
    }),
  })),
  final_exam: z.object({
    title: z.string(),
    questions: z.array(z.object({
      question_text: z.string(),
      options: z.array(z.string()),
      correct_answer: z.string(),
      points: z.number().default(1),
    })),
  }),
});

// Module schemas
export const ModuleSchema = z.object({
  id: z.number(),
  course_id: z.number(),
  title: z.string(),
  content: z.string().nullable(),
  order_index: z.number(),
  duration_minutes: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Quiz schemas
export const QuizSchema = z.object({
  id: z.number(),
  module_id: z.number().nullable(),
  course_id: z.number().nullable(),
  title: z.string(),
  is_final_exam: z.boolean().default(false),
  passing_score: z.number().default(70),
  time_limit_minutes: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const QuizQuestionSchema = z.object({
  id: z.number(),
  quiz_id: z.number(),
  question_text: z.string(),
  question_type: z.enum(['multiple_choice', 'true_false', 'essay']).default('multiple_choice'),
  correct_answer: z.string(),
  options: z.string().nullable(),
  points: z.number().default(1),
  order_index: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Badge schemas
export const BadgeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  icon_url: z.string().nullable(),
  criteria: z.string().nullable(),
  points_required: z.number().nullable(),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateBadgeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  icon_url: z.string().optional(),
  criteria: z.string().optional(),
  points_required: z.number().optional(),
});

// Certificate schemas
export const CertificateSchema = z.object({
  id: z.number(),
  name: z.string(),
  template_url: z.string().nullable(),
  course_id: z.number().nullable(),
  description: z.string().nullable(),
  requirements: z.string().nullable(),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateCertificateSchema = z.object({
  name: z.string().min(1),
  template_url: z.string().optional(),
  course_id: z.number().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
});

// Challenge schemas
export const ChallengeSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  challenge_type: z.enum(['daily', 'weekly', 'monthly', 'special']),
  points_reward: z.number().default(0),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateChallengeSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  challenge_type: z.enum(['daily', 'weekly', 'monthly', 'special']),
  points_reward: z.number().default(0),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

// AI Generation request schemas
export const GenerateCourseRequest = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  target_audience: z.string().min(1),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  modules_count: z.number().min(1).max(20).default(12),
});

// Dashboard stats schemas
export const DashboardStatsSchema = z.object({
  total_users: z.number(),
  total_courses: z.number(),
  total_badges: z.number(),
  total_certificates: z.number(),
  active_challenges: z.number(),
  recent_enrollments: z.number(),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type CreateCourse = z.infer<typeof CreateCourseSchema>;
export type AICourseMaterialType = z.infer<typeof AICourseMaterial>;
export type Module = z.infer<typeof ModuleSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type Badge = z.infer<typeof BadgeSchema>;
export type CreateBadge = z.infer<typeof CreateBadgeSchema>;
export type Certificate = z.infer<typeof CertificateSchema>;
export type CreateCertificate = z.infer<typeof CreateCertificateSchema>;
export type Challenge = z.infer<typeof ChallengeSchema>;
export type CreateChallenge = z.infer<typeof CreateChallengeSchema>;
export type GenerateCourseRequestType = z.infer<typeof GenerateCourseRequest>;
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
