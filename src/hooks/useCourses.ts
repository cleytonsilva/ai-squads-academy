import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  Course,
  GenerationJob,
  GenerateCourseRequest,
  UseCoursesReturn,
  CourseStatus
} from '@/types';

export function useCourses(): UseCoursesReturn {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationJob, setGenerationJob] = useState<GenerationJob | null>(null);
  const [jobProgress, setJobProgress] = useState<any>(null);
  const [generatedCourse, setGeneratedCourse] = useState<Course | null>(null);

  // Fetch all courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se há uma sessão ativa
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          modules:course_modules(
            *,
            quizzes:module_quizzes(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('JWT')) {
          throw new Error('Erro de autenticação. Por favor, faça login novamente.');
        }
        throw error;
      }

      setCourses(data || []);
      toast.success('Cursos carregados com sucesso!');
    } catch (err: any) {
      console.error('Erro ao buscar cursos:', err);
      setError(err.message || 'Erro ao carregar cursos');
      toast.error(err.message || 'Erro ao carregar cursos');
      
      // Se for erro de autenticação, limpar o estado
      if (err.message.includes('autenticação') || err.message.includes('sessão')) {
        setCourses([]);
        // Forçar recarregamento da página para atualizar o estado de autenticação
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate course using AI
  const generateCourse = async (request: GenerateCourseRequest) => {
    try {
      setLoading(true);
      setError(null);
      setGenerationJob(null);
      setGeneratedCourse(null);
      setJobProgress(null);

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('ai-generate-course', {
        body: request
      });

      if (error) throw error;

      if (data?.job_id) {
        // Set initial job status
        setGenerationJob({
          id: data.job_id,
          type: 'ai_generate_course',
          status: 'processing',
          input: request,
          output: null,
          error: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          completed_at: null
        });

        // Start polling for job status
        await pollJobStatus(data.job_id);
      } else {
        throw new Error('Job ID não retornado pela função');
      }
    } catch (err: any) {
      console.error('Erro ao gerar curso:', err);
      setError(err.message || 'Erro ao gerar curso');
      toast.error('Erro ao gerar curso: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  // Poll job status
  const pollJobStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        // Check job status in generation_jobs table
        const { data: jobData, error: jobError } = await supabase
          .from('generation_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (jobError) {
          console.error('Erro ao verificar status do job:', jobError);
          return;
        }

        if (jobData) {
          setGenerationJob(jobData);
          setJobProgress(jobData.output);

          // If job is completed, fetch the generated course
          if (jobData.status === 'completed' && jobData.output?.course_id) {
            const { data: courseData, error: courseError } = await supabase
              .from('courses')
              .select(`
                *,
                modules:course_modules(
                  *,
                  quizzes:module_quizzes(*)
                )
              `)
              .eq('id', jobData.output.course_id)
              .single();

            if (!courseError && courseData) {
              setGeneratedCourse(courseData);
            }

            clearInterval(pollInterval);
            toast.success('Curso gerado com sucesso!');
          } else if (jobData.status === 'failed') {
            clearInterval(pollInterval);
            setError(jobData.error || 'Erro na geração do curso');
            toast.error('Falha na geração do curso');
          }
        }
      } catch (err: any) {
        console.error('Erro no polling:', err);
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  };

  // Publish course
  const publishCourse = async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('courses')
        .update({ status: 'published' as CourseStatus })
        .eq('id', courseId);

      if (error) throw error;

      // Update local state
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, status: 'published' as CourseStatus }
          : course
      ));

      if (generatedCourse?.id === courseId) {
        setGeneratedCourse(prev => prev ? { ...prev, status: 'published' as CourseStatus } : null);
      }

      toast.success('Curso publicado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao publicar curso:', err);
      setError(err.message || 'Erro ao publicar curso');
      toast.error('Erro ao publicar curso');
    } finally {
      setLoading(false);
    }
  };

  // Delete course
  const deleteCourse = async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      // Update local state
      setCourses(prev => prev.filter(course => course.id !== courseId));

      if (generatedCourse?.id === courseId) {
        setGeneratedCourse(null);
      }

      toast.success('Curso excluído com sucesso!');
    } catch (err: any) {
      console.error('Erro ao excluir curso:', err);
      setError(err.message || 'Erro ao excluir curso');
      toast.error('Erro ao excluir curso');
    } finally {
      setLoading(false);
    }
  };

  // Reset generation state
  const resetGeneration = () => {
    setGenerationJob(null);
    setJobProgress(null);
    setGeneratedCourse(null);
    setError(null);
  };

  // Load courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  return {
    courses,
    loading,
    error,
    generationJob,
    jobProgress,
    generatedCourse,
    fetchCourses,
    generateCourse,
    publishCourse,
    deleteCourse,
    resetGeneration,
    pollJobStatus
  };
}