import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentProfile } from './useCurrentProfile';

/**
 * Interface para um curso com progresso
 */
export interface Course {
  id: string;
  title: string;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  total_lessons: number;
  completed_lessons: number;
  last_accessed: string;
}

/**
 * Hook personalizado para gerenciar o progresso dos cursos do usuário
 * Responsável por buscar e processar dados de progresso em cursos
 */
export function useCourseProgress() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { profile } = useCurrentProfile();

  /**
   * Busca o progresso do usuário em todos os cursos
   */
  const fetchCourseProgress = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar progresso do usuário nos cursos
      const { data: userProgressData, error: progressError } = await supabase
        .from('user_progress')
        .select(`
          *,
          courses (
            id,
            title,
            is_active
          )
        `)
        .eq('user_id', profile.id);

      if (progressError) {
        console.warn('Erro ao buscar progresso dos cursos:', progressError);
        return;
      }

      // Transformar dados para o formato esperado
      const coursesData: Course[] = userProgressData?.map(progress => ({
        id: progress.course_id,
        title: progress.courses?.title || 'Curso sem título',
        progress: progress.completion_percentage || 0,
        status: progress.completion_percentage === 100 ? 'completed' : 'active',
        total_lessons: progress.total_modules || 0,
        completed_lessons: progress.modules_completed || 0,
        last_accessed: progress.last_accessed || progress.updated_at
      })) || [];

      setCourses(coursesData);
    } catch (error) {
      console.error('Erro ao buscar progresso dos cursos:', error);
      setError('Erro ao carregar progresso dos cursos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza o progresso de um curso específico
   */
  const updateCourseProgress = async (
    courseId: string, 
    moduleId: string, 
    isCompleted: boolean
  ) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: profile.id,
          course_id: courseId,
          module_id: moduleId,
          is_completed: isCompleted,
          last_accessed_at: new Date().toISOString(),
          completed_at: isCompleted ? new Date().toISOString() : null
        });

      if (error) {
        throw error;
      }

      // Recarregar progresso após atualização
      await fetchCourseProgress();
    } catch (error) {
      console.error('Erro ao atualizar progresso do curso:', error);
    }
  };

  /**
   * Marca um curso como pausado
   */
  const pauseCourse = async (courseId: string) => {
    setCourses(prev => 
      prev.map(course => 
        course.id === courseId 
          ? { ...course, status: 'paused' as const }
          : course
      )
    );
  };

  /**
   * Retoma um curso pausado
   */
  const resumeCourse = async (courseId: string) => {
    setCourses(prev => 
      prev.map(course => 
        course.id === courseId 
          ? { ...course, status: 'active' as const }
          : course
      )
    );
  };

  /**
   * Calcula estatísticas gerais de progresso
   */
  const getProgressStats = () => {
    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.status === 'completed').length;
    const activeCourses = courses.filter(c => c.status === 'active').length;
    const pausedCourses = courses.filter(c => c.status === 'paused').length;
    
    const averageProgress = totalCourses > 0 
      ? courses.reduce((sum, course) => sum + course.progress, 0) / totalCourses 
      : 0;

    return {
      totalCourses,
      completedCourses,
      activeCourses,
      pausedCourses,
      averageProgress: Math.round(averageProgress),
      completionRate: totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0
    };
  };

  // Carregar progresso quando o perfil estiver disponível
  useEffect(() => {
    if (profile?.id) {
      fetchCourseProgress();
    }
  }, [profile?.id]);

  return {
    courses,
    loading,
    error,
    refetch: fetchCourseProgress,
    updateProgress: updateCourseProgress,
    pauseCourse,
    resumeCourse,
    stats: getProgressStats()
  };
}