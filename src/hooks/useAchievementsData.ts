// Hook refatorado que combina os hooks específicos para manter compatibilidade
import { useAchievements, type Achievement, type UserAchievement } from './useAchievements';
import { useCourseProgress, type Course } from './useCourseProgress';
import { useStudyStats, type StudyStats, type PerformanceData, type CompetencyData } from './useStudyStats';
import { useRankingData, type RankingData } from './useRankingData';

// Re-exportar tipos para manter compatibilidade
export type { Achievement, UserAchievement, Course, StudyStats, RankingData, CompetencyData, PerformanceData };

/**
 * Hook principal que combina todos os hooks específicos
 * Mantém compatibilidade com o código existente
 */
export function useAchievementsData() {
  // Usar os hooks específicos
  const achievementsHook = useAchievements();
  const courseProgressHook = useCourseProgress();
  const studyStatsHook = useStudyStats();
  const rankingHook = useRankingData();

  // Calcular estado de loading geral
  const loading = achievementsHook.loading || courseProgressHook.loading || 
                 studyStatsHook.loading || rankingHook.loading;

  // Combinar erros se houver
  const error = achievementsHook.error || courseProgressHook.error || 
               studyStatsHook.error || rankingHook.error;

  // Função de refetch que chama todos os hooks específicos
  const refetch = () => {
    achievementsHook.refetch();
    courseProgressHook.refetch();
    studyStatsHook.refetch();
    rankingHook.refetch();
  };

  return {
    achievements: achievementsHook.achievements,
    userAchievements: achievementsHook.userAchievements,
    courses: courseProgressHook.courses,
    studyStats: studyStatsHook.studyStats,
    rankingData: rankingHook.rankingData,
    performanceData: studyStatsHook.performanceData,
    competencyData: studyStatsHook.competencyData,
    loading,
    error,
    refetch
  };
}