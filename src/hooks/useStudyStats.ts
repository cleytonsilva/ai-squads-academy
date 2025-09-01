import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentProfile } from './useCurrentProfile';

/**
 * Interface para estatísticas de estudo
 */
export interface StudyStats {
  total_hours: number;
  weekly_hours: number;
  subjects: Array<{
    name: string;
    hours: number;
    performance: number;
  }>;
  assessments: {
    total: number;
    passed: number;
    average_score: number;
  };
}

/**
 * Interface para dados de performance mensal
 */
export interface PerformanceData {
  month: string;
  score: number;
  hours: number;
}

/**
 * Interface para dados de competência por área
 */
export interface CompetencyData {
  subject: string;
  score: number;
  fullMark: number;
}

/**
 * Hook personalizado para gerenciar estatísticas de estudo do usuário
 * Responsável por calcular e fornecer métricas de aprendizado
 */
export function useStudyStats() {
  const [studyStats, setStudyStats] = useState<StudyStats | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [competencyData, setCompetencyData] = useState<CompetencyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { profile } = useCurrentProfile();

  /**
   * Busca e calcula estatísticas de estudo do usuário
   */
  const fetchStudyStats = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar atividades do usuário
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (activitiesError) {
        console.warn('Erro ao buscar atividades:', activitiesError);
      }

      // Buscar tentativas de avaliações
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('user_assessment_attempts')
        .select('*')
        .eq('user_id', profile.id);

      if (assessmentError) {
        console.warn('Erro ao buscar avaliações:', assessmentError);
      }

      // Calcular estatísticas
      const totalHours = activitiesData?.reduce((sum, activity) => {
        return sum + (activity.metadata?.hours || 0);
      }, 0) || 0;

      const assessments = {
        total: assessmentData?.length || 0,
        passed: assessmentData?.filter(a => a.is_passed).length || 0,
        average_score: assessmentData?.length ? 
          assessmentData.reduce((sum, a) => sum + (a.score || 0), 0) / assessmentData.length : 0
      };

      const stats: StudyStats = {
        total_hours: totalHours,
        weekly_hours: Math.round(totalHours / 4), // Estimativa semanal
        subjects: [
          { name: 'Frontend', hours: Math.round(totalHours * 0.3), performance: 85 },
          { name: 'Backend', hours: Math.round(totalHours * 0.25), performance: 78 },
          { name: 'Database', hours: Math.round(totalHours * 0.2), performance: 82 },
          { name: 'DevOps', hours: Math.round(totalHours * 0.15), performance: 70 },
          { name: 'Design', hours: Math.round(totalHours * 0.1), performance: 92 }
        ],
        assessments
      };

      setStudyStats(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de estudo:', error);
      setError('Erro ao carregar estatísticas de estudo');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gera dados de performance baseados em atividades reais
   */
  const generatePerformanceData = async () => {
    if (!profile?.id) return;

    try {
      const { data: activitiesData, error } = await supabase
        .from('user_activities')
        .select('created_at, points_earned')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Erro ao buscar dados de performance:', error);
        return;
      }

      // Agrupar por mês
      const monthlyData: { [key: string]: { score: number; hours: number; count: number } } = {};
      
      activitiesData?.forEach(activity => {
        const date = new Date(activity.created_at);
        const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { score: 0, hours: 0, count: 0 };
        }
        
        monthlyData[monthKey].score += activity.points_earned || 0;
        monthlyData[monthKey].hours += 2; // Estimativa de 2 horas por atividade
        monthlyData[monthKey].count += 1;
      });

      const performance: PerformanceData[] = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        score: Math.round(data.score / Math.max(data.count, 1)),
        hours: data.hours
      }));

      setPerformanceData(performance);
    } catch (error) {
      console.error('Erro ao gerar dados de performance:', error);
    }
  };

  /**
   * Gera dados de competência baseados em cursos e avaliações
   */
  const generateCompetencyData = async () => {
    if (!profile?.id) return;

    try {
      const { data: assessmentData, error } = await supabase
        .from('user_assessment_attempts')
        .select(`
          score,
          assessments (
            title,
            courses (
              title
            )
          )
        `)
        .eq('user_id', profile.id)
        .eq('is_passed', true);

      if (error) {
        console.warn('Erro ao buscar dados de competência:', error);
        return;
      }

      // Agrupar por área de conhecimento
      const competencyMap: { [key: string]: number[] } = {
        'Programação': [],
        'Banco de Dados': [],
        'UI/UX Design': [],
        'DevOps': [],
        'Soft Skills': [],
        'Gestão de Projetos': []
      };

      assessmentData?.forEach(attempt => {
        const courseTitle = attempt.assessments?.courses?.title || '';
        const score = attempt.score || 0;
        
        // Categorizar baseado no título do curso
        if (courseTitle.toLowerCase().includes('react') || courseTitle.toLowerCase().includes('javascript')) {
          competencyMap['Programação'].push(score);
        } else if (courseTitle.toLowerCase().includes('database') || courseTitle.toLowerCase().includes('sql')) {
          competencyMap['Banco de Dados'].push(score);
        } else if (courseTitle.toLowerCase().includes('design') || courseTitle.toLowerCase().includes('ui')) {
          competencyMap['UI/UX Design'].push(score);
        } else if (courseTitle.toLowerCase().includes('devops') || courseTitle.toLowerCase().includes('docker')) {
          competencyMap['DevOps'].push(score);
        } else {
          competencyMap['Programação'].push(score); // Default
        }
      });

      const competency: CompetencyData[] = Object.entries(competencyMap).map(([subject, scores]) => ({
        subject,
        score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 70,
        fullMark: 100
      }));

      setCompetencyData(competency);
    } catch (error) {
      console.error('Erro ao gerar dados de competência:', error);
    }
  };

  /**
   * Calcula a tendência de aprendizado (crescimento/declínio)
   */
  const getLearningTrend = () => {
    if (performanceData.length < 2) return 0;
    
    const recent = performanceData.slice(-3);
    const older = performanceData.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, data) => sum + data.score, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, data) => sum + data.score, 0) / older.length : recentAvg;
    
    return Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
  };

  // Carregar dados quando o perfil estiver disponível
  useEffect(() => {
    if (profile?.id) {
      Promise.all([
        fetchStudyStats(),
        generatePerformanceData(),
        generateCompetencyData()
      ]);
    }
  }, [profile?.id]);

  return {
    studyStats,
    performanceData,
    competencyData,
    loading,
    error,
    refetch: () => {
      if (profile?.id) {
        Promise.all([
          fetchStudyStats(),
          generatePerformanceData(),
          generateCompetencyData()
        ]);
      }
    },
    learningTrend: getLearningTrend()
  };
}