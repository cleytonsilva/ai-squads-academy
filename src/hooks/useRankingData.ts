import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentProfile } from './useCurrentProfile';

/**
 * Interface para dados de ranking
 */
export interface RankingData {
  current_position: number;
  total_students: number;
  top_students: Array<{
    position: number;
    name: string;
    score: number;
    avatar?: string;
  }>;
}

/**
 * Interface para um estudante no ranking
 */
interface RankedStudent {
  id: string;
  name: string;
  score: number;
  avatar?: string;
  achievements_count: number;
  courses_completed: number;
}

/**
 * Hook personalizado para gerenciar dados de ranking e classificação
 * Responsável por calcular posições e fornecer dados de leaderboard
 */
export function useRankingData() {
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { profile } = useCurrentProfile();

  /**
   * Busca e calcula dados de ranking dos usuários
   */
  const fetchRankingData = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar todos os usuários com suas informações básicas
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, xp')
        .not('display_name', 'is', null)
        .limit(100);

      if (usersError) {
        console.warn('Erro ao buscar usuários para ranking:', usersError);
        return;
      }

      // Calcular pontuação para cada usuário
      const usersWithScores = await Promise.all(
        usersData?.map(async (user) => {
          // Buscar conquistas do usuário
          const { data: userAchievements } = await supabase
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', user.id)
            .not('unlocked_at', 'is', null);

          // Buscar cursos concluídos
          const { data: completedCourses } = await supabase
            .from('user_progress')
            .select('course_id')
            .eq('user_id', user.id)
            .eq('completion_percentage', 100);

          // Calcular pontuação total
          const achievementsScore = (userAchievements?.length || 0) * 100;
          const coursesScore = (completedCourses?.length || 0) * 200;
          const xpScore = user.xp || 0;
          const totalScore = achievementsScore + coursesScore + xpScore;
          
          return {
            id: user.id,
            name: user.display_name || 'Usuário',
            score: totalScore,
            avatar: user.avatar_url,
            achievements_count: userAchievements?.length || 0,
            courses_completed: completedCourses?.length || 0
          } as RankedStudent;
        }) || []
      );

      // Ordenar por pontuação
      const sortedUsers = usersWithScores
        .sort((a, b) => b.score - a.score)
        .map((user, index) => ({
          position: index + 1,
          name: user.name,
          score: user.score,
          avatar: user.avatar
        }));

      // Encontrar posição do usuário atual
      const currentUserPosition = sortedUsers.findIndex(user => 
        user.name === profile.display_name
      ) + 1;

      const ranking: RankingData = {
        current_position: currentUserPosition || sortedUsers.length + 1,
        total_students: sortedUsers.length,
        top_students: sortedUsers.slice(0, 10)
      };

      setRankingData(ranking);
    } catch (error) {
      console.error('Erro ao buscar dados de ranking:', error);
      setError('Erro ao carregar ranking');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Busca usuários próximos na classificação
   */
  const getNearbyUsers = (range: number = 3) => {
    if (!rankingData) return [];
    
    const currentPos = rankingData.current_position;
    const start = Math.max(1, currentPos - range);
    const end = Math.min(rankingData.total_students, currentPos + range);
    
    return rankingData.top_students.filter(
      user => user.position >= start && user.position <= end
    );
  };

  /**
   * Calcula a diferença de pontos para o próximo usuário
   */
  const getPointsToNextRank = () => {
    if (!rankingData || rankingData.current_position === 1) return 0;
    
    const currentUser = rankingData.top_students.find(
      user => user.position === rankingData.current_position
    );
    
    const nextUser = rankingData.top_students.find(
      user => user.position === rankingData.current_position - 1
    );
    
    if (!currentUser || !nextUser) return 0;
    
    return nextUser.score - currentUser.score;
  };

  /**
   * Calcula estatísticas de ranking
   */
  const getRankingStats = () => {
    if (!rankingData) return null;
    
    const isTopTen = rankingData.current_position <= 10;
    const isTopHalf = rankingData.current_position <= Math.ceil(rankingData.total_students / 2);
    const percentile = Math.round(
      ((rankingData.total_students - rankingData.current_position + 1) / rankingData.total_students) * 100
    );
    
    return {
      isTopTen,
      isTopHalf,
      percentile,
      pointsToNext: getPointsToNextRank()
    };
  };

  /**
   * Simula uma atualização de pontuação (para testes)
   */
  const simulateScoreUpdate = (newScore: number) => {
    if (!rankingData) return;
    
    // Atualizar pontuação do usuário atual e recalcular posições
    const updatedUsers = rankingData.top_students.map(user => 
      user.name === profile?.display_name 
        ? { ...user, score: newScore }
        : user
    ).sort((a, b) => b.score - a.score)
      .map((user, index) => ({ ...user, position: index + 1 }));
    
    const newPosition = updatedUsers.find(
      user => user.name === profile?.display_name
    )?.position || rankingData.current_position;
    
    setRankingData({
      ...rankingData,
      current_position: newPosition,
      top_students: updatedUsers
    });
  };

  // Carregar dados quando o perfil estiver disponível
  useEffect(() => {
    if (profile?.id) {
      fetchRankingData();
    }
  }, [profile?.id]);

  return {
    rankingData,
    loading,
    error,
    refetch: fetchRankingData,
    getNearbyUsers,
    getPointsToNextRank,
    stats: getRankingStats(),
    simulateScoreUpdate
  };
}