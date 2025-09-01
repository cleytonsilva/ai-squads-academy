import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useMemo, useEffect } from "react";

// Interfaces para tipagem
interface Certificate {
  id: string;
  course_id: string;
  issued_at: string;
  certificate_number: string | null;
}

interface UserBadge {
  id: string;
  badge_id: string;
  awarded_at: string;
}

interface Badge {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category?: string;
  points?: number;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration_hours: number | null;
  is_published: boolean;
  category: string | null;
  thumbnail_url: string | null;
  required_plan: 'free' | 'basic' | 'premium' | 'enterprise';
  prerequisites: string[] | null;
  created_at: string;
  updated_at: string;
}

interface UserProgress {
  id: string;
  course_id: string;
  completion_percentage: number;
  last_accessed: string;
  time_spent_minutes: number | null;
  modules_completed: number;
  total_modules: number;
  quiz_scores: number[] | null;
  created_at: string;
  updated_at: string;
}

interface Enrollment {
  id: string;
  course_id: string;
  enrolled_at: string;
  status: 'active' | 'completed' | 'paused';
}

interface Activity {
  id: string;
  course_id: string;
  activity_type: 'lesson_completed' | 'quiz_completed' | 'assignment_submitted';
  points_earned: number;
  created_at: string;
}

/**
 * Hook para buscar certificados do aluno
 */
export function useStudentCertificates() {
  const { profile } = useCurrentProfile();
  
  return useQuery({
    queryKey: ["student-certificates", profile?.id],
    enabled: !!profile?.id,
    queryFn: async (): Promise<Certificate[]> => {
      const { data, error } = await supabase
        .from("certificates")
        .select("id,course_id,issued_at,certificate_number")
        .eq("user_id", profile!.id)
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data as Certificate[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para buscar badges do aluno
 */
export function useStudentBadges() {
  const { profile } = useCurrentProfile();
  
  const { data: userBadges, ...userBadgesQuery } = useQuery({
    queryKey: ["student-user-badges", profile?.id],
    enabled: !!profile?.id,
    queryFn: async (): Promise<UserBadge[]> => {
      const { data, error } = await supabase
        .from("user_badges")
        .select("id,badge_id,awarded_at")
        .eq("user_id", profile!.id)
        .order("awarded_at", { ascending: false });
      if (error) throw error;
      return data as UserBadge[];
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const badgeIds = useMemo(() => 
    Array.from(new Set((userBadges || []).map(b => b.badge_id))), 
    [userBadges]
  );
  
  const { data: badges, ...badgesQuery } = useQuery({
    queryKey: ["student-badges", badgeIds.join(",")],
    enabled: badgeIds.length > 0,
    queryFn: async (): Promise<Badge[]> => {
      const { data, error } = await supabase
        .from("badges")
        .select("id,name,description,image_url")
        .in("id", badgeIds);
      if (error) throw error;
      return data as Badge[];
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });

  return {
    userBadges,
    badges,
    isLoading: userBadgesQuery.isLoading || badgesQuery.isLoading,
    error: userBadgesQuery.error || badgesQuery.error,
  };
}

/**
 * Hook para buscar cursos disponíveis
 */
export function useStudentCourses() {
  const { profile } = useCurrentProfile();
  
  const { data: courses, ...coursesQuery } = useQuery({
    queryKey: ["student-courses"],
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("title");
      if (error) throw error;
      return data as Course[];
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });

  const { data: enrollments, ...enrollmentsQuery } = useQuery({
    queryKey: ["student-enrollments", profile?.id],
    enabled: !!profile?.id,
    queryFn: async (): Promise<Enrollment[]> => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", profile!.id);
      if (error) throw error;
      return data as Enrollment[];
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  return {
    courses,
    enrollments,
    isLoading: coursesQuery.isLoading || enrollmentsQuery.isLoading,
    error: coursesQuery.error || enrollmentsQuery.error,
  };
}

/**
 * Hook para buscar progresso detalhado do aluno
 */
export function useStudentProgress() {
  const { profile } = useCurrentProfile();
  
  return useQuery({
    queryKey: ["student-progress", profile?.id],
    enabled: !!profile?.id,
    queryFn: async (): Promise<UserProgress[]> => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", profile!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as UserProgress[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos (dados mais dinâmicos)
    cacheTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar atividades do aluno
 */
export function useStudentActivities(timeRange: '7d' | '30d' | '90d' | 'all' = '30d') {
  const { profile } = useCurrentProfile();
  
  return useQuery({
    queryKey: ["student-activities", profile?.id, timeRange],
    enabled: !!profile?.id,
    queryFn: async (): Promise<Activity[]> => {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      
      const { data, error } = await supabase
        .from("user_activities")
        .select("*")
        .eq("user_id", profile!.id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Activity[];
    },
    staleTime: 1 * 60 * 1000, // 1 minuto
    cacheTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar dados relacionados a cursos (títulos, categorias, etc.)
 */
export function useCourseData(courseIds: string[]) {
  return useQuery({
    queryKey: ["course-data", courseIds.join(",")],
    enabled: courseIds.length > 0,
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("id,title,level,category,duration_hours")
        .in("id", courseIds);
      if (error) throw error;
      return data as Course[];
    },
    staleTime: 15 * 60 * 1000, // 15 minutos (dados mais estáticos)
    cacheTime: 30 * 60 * 1000,
  });
}

/**
 * Hook combinado para dashboard do aluno
 * Otimiza carregamento de dados essenciais
 */
export function useStudentDashboardData() {
  const { profile } = useCurrentProfile();
  
  // Debug logs para rastrear carregamentos
  const debugLog = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[useStudentDashboardData] ${message}`, data || '');
    }
  };
  
  // Log quando o hook é executado
  useEffect(() => {
    debugLog('Hook executado', { profileId: profile?.id });
  }, [profile?.id]);
  
  const certificates = useStudentCertificates();
  const badges = useStudentBadges();
  const courses = useStudentCourses();
  const progress = useStudentProgress();
  const activities = useStudentActivities();

  // Calcular estatísticas gerais
  const stats = useMemo(() => {
    if (!progress.data) return {
      totalCourses: 0,
      completedCourses: 0,
      averageProgress: 0,
      totalCertificates: 0,
      totalBadges: 0,
      totalTimeSpent: 0
    };

    const totalCourses = progress.data.length;
    const completedCourses = progress.data.filter(p => p.completion_percentage === 100).length;
    const averageProgress = totalCourses > 0 ? 
      Math.round(progress.data.reduce((sum, p) => sum + p.completion_percentage, 0) / totalCourses) : 0;
    const totalTimeSpent = progress.data.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0);

    return {
      totalCourses,
      completedCourses,
      averageProgress,
      totalCertificates: certificates.data?.length || 0,
      totalBadges: badges.userBadges?.length || 0,
      totalTimeSpent
    };
  }, [progress.data, certificates.data, badges.userBadges]);

  // Status de carregamento geral
  const isLoading = certificates.isLoading || badges.isLoading || courses.isLoading || progress.isLoading;
  const hasError = certificates.error || badges.error || courses.error || progress.error;

  return {
    profile,
    certificates: certificates.data || [],
    userBadges: badges.userBadges || [],
    badgeDetails: badges.badges || [],
    courses: courses.courses || [],
    enrollments: courses.enrollments || [],
    progress: progress.data || [],
    activities: activities.data || [],
    stats,
    isLoading,
    hasError,
    // Funções utilitárias
    getCourseTitle: (courseId: string) => 
      courses.courses?.find(c => c.id === courseId)?.title || 'Curso não encontrado',
    getBadgeDetails: (badgeId: string) => 
      badges.badges?.find(b => b.id === badgeId),
  };
}

/**
 * Hook para verificar permissões de acesso a cursos
 */
export function useCourseAccess() {
  const { profile } = useCurrentProfile();
  
  // Simular plano do usuário (em produção, viria do perfil)
  const userPlan = profile?.subscription_plan || 'free';
  
  const canAccessCourse = (course: Course): boolean => {
    const planHierarchy = { free: 0, basic: 1, premium: 2, enterprise: 3 };
    const userPlanLevel = planHierarchy[userPlan as keyof typeof planHierarchy] || 0;
    const coursePlanLevel = planHierarchy[course.required_plan] || 0;
    return userPlanLevel >= coursePlanLevel;
  };
  
  const meetsPrerequisites = (course: Course, completedCourses: string[]): boolean => {
    if (!course.prerequisites || course.prerequisites.length === 0) return true;
    return course.prerequisites.every(prereq => completedCourses.includes(prereq));
  };
  
  return {
    userPlan,
    canAccessCourse,
    meetsPrerequisites,
  };
}

/**
 * Hook para atualização em tempo real de dados do aluno
 */
export function useRealtimeStudentData() {
  const { profile } = useCurrentProfile();
  
  // Configurar subscriptions para atualizações em tempo real
  // Este hook pode ser expandido para incluir WebSocket ou Server-Sent Events
  
  return {
    // Placeholder para funcionalidades de tempo real
    isConnected: true,
    lastUpdate: new Date(),
  };
}

/**
 * Hook principal para dados do aluno (alias para useStudentDashboardData)
 * Mantém compatibilidade com componentes existentes
 */
export function useStudentData() {
  const dashboardData = useStudentDashboardData();
  
  return {
    studentData: {
      courses_in_progress: dashboardData.enrollments?.filter(e => e.status === 'active').length || 0,
      active_missions: dashboardData.activities?.filter(a => a.activity_type === 'lesson_completed').length || 0,
      achievements_unlocked: dashboardData.userBadges?.length || 0,
      total_xp: dashboardData.stats.totalTimeSpent || 0,
      level: Math.floor((dashboardData.stats.totalTimeSpent || 0) / 100) + 1,
      completed_courses: dashboardData.stats.completedCourses || 0,
      certificates_earned: dashboardData.stats.totalCertificates || 0,
    },
    isLoading: dashboardData.isLoading,
    error: dashboardData.hasError,
    refetch: () => {
      // Implementar refetch se necessário
      window.location.reload();
    }
  };
}