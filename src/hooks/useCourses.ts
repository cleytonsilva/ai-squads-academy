import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { 
  handleSupabaseError, 
  executeWithRetry, 
  safeSupabaseOperation,
  checkUserPermissions,
  SupabaseErrorType 
} from '@/utils/supabaseErrorHandler';
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
  const { toast } = useToast();

  // Fetch all courses
  const fetchCourses = async () => {
    setLoading(true);
    setError(null);

    // Verificar permissões antes de buscar cursos
    const permissionCheck = await checkUserPermissions(supabase);
    if (!permissionCheck.success) {
      setError(permissionCheck.error);
      toast({
        title: "Erro",
        description: permissionCheck.error,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Buscar cursos com retry automático
    const result = await executeWithRetry(async () => {
      return await supabase
        .from('courses')
        .select(`
          *,
          modules(
            *,
            quizzes:module_quizzes(*)
          )
        `)
        .order('created_at', { ascending: false });
    }, 3);

    if (result.success) {
      setCourses(result.data || []);
      toast({
        title: "Sucesso",
        description: "Cursos carregados com sucesso!",
      });
    } else {
      console.error('Erro ao buscar cursos:', result.error);
      setError(result.error);
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  // Generate course using AI
  const generateCourse = async (request: GenerateCourseRequest) => {
    // Verificar permissões antes de gerar curso
    const permissionCheck = await checkUserPermissions(supabase);
    if (!permissionCheck.success) {
      setError(permissionCheck.error);
      toast({
        title: "Erro",
        description: permissionCheck.error,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setGenerationJob(null);
    setGeneratedCourse(null);
    setJobProgress(null);

    try {
      // Chamar Edge Function com retry automático
      const result = await executeWithRetry(async () => {
        const { data, error } = await supabase.functions.invoke('ai-generate-course', {
          body: request
        });
        
        if (error) throw error;
        return data;
      }, 2);

      if (!result.success) {
        throw new Error(result.error);
      }

      if (result.data?.job_id) {
        // Set initial job status
        setGenerationJob({
          id: result.data.job_id,
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
        await pollJobStatus(result.data.job_id);
      } else {
        throw new Error('Job ID não retornado pela função');
      }
    } catch (err: any) {
      console.error('Erro ao gerar curso:', err);
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Poll job status
  const pollJobStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      // Verificar status do job com operação segura
      const jobResult = await safeSupabaseOperation(async () => {
        return await supabase
          .from('generation_jobs')
          .select('*')
          .eq('id', jobId)
          .single();
      });

      if (!jobResult.success) {
        console.error('Erro ao verificar status do job:', jobResult.error);
        return;
      }

      const jobData = jobResult.data;
      if (jobData) {
        setGenerationJob(jobData);
        setJobProgress(jobData.output);

        // If job is completed, fetch the generated course
        if (jobData.status === 'completed' && jobData.output?.course_id) {
          const courseResult = await safeSupabaseOperation(async () => {
            return await supabase
              .from('courses')
              .select(`
                *,
                modules(
                  *,
                  quizzes:module_quizzes(*)
                )
              `)
              .eq('id', jobData.output.course_id)
              .single();
          });

          if (courseResult.success && courseResult.data) {
            setGeneratedCourse(courseResult.data);
          }

          clearInterval(pollInterval);
          toast({
            title: "Sucesso",
            description: "Curso gerado com sucesso!",
          });
        } else if (jobData.status === 'failed') {
          clearInterval(pollInterval);
          setError(jobData.error || 'Erro na geração do curso');
          toast({
            title: "Erro",
            description: "Falha na geração do curso",
            variant: "destructive",
          });
        }
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  };

  // Publish course
  const publishCourse = async (courseId: string) => {
    setLoading(true);
    setError(null);

    const result = await safeSupabaseOperation(async () => {
      return await supabase
        .from('courses')
        .update({ status: 'published' as CourseStatus })
        .eq('id', courseId);
    });

    if (result.success) {
      // Update local state
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, status: 'published' as CourseStatus }
          : course
      ));

      if (generatedCourse?.id === courseId) {
        setGeneratedCourse(prev => prev ? { ...prev, status: 'published' as CourseStatus } : null);
      }

      toast({
        title: "Sucesso",
        description: "Curso publicado com sucesso!",
      });
    } else {
      console.error('Erro ao publicar curso:', result.error);
      setError(result.error);
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  // Delete course
  const deleteCourse = async (courseId: string) => {
    setLoading(true);
    setError(null);

    const result = await safeSupabaseOperation(async () => {
      return await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
    });

    if (result.success) {
      // Update local state
      setCourses(prev => prev.filter(course => course.id !== courseId));

      if (generatedCourse?.id === courseId) {
        setGeneratedCourse(null);
      }

      toast({
        title: "Sucesso",
        description: "Curso excluído com sucesso!",
      });
    } else {
      console.error('Erro ao excluir curso:', result.error);
      setError(result.error);
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      });
    }

    setLoading(false);
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