import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentProfile } from './useCurrentProfile';

/**
 * Interface para uma conquista
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  rarity: 'Comum' | 'Raro' | 'Épico' | 'Lendário';
  xp_reward: number;
  icon_name: string;
  total_required: number;
  unlocked: boolean;
  unlocked_date?: string;
  progress: number;
  created_at: string;
}

/**
 * Interface para conquista do usuário
 */
export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  unlocked_at?: string;
  created_at: string;
}

/**
 * Hook personalizado para gerenciar conquistas do usuário
 * Responsável por buscar, processar e fornecer dados de conquistas
 */
export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { profile } = useCurrentProfile();

  /**
   * Busca todas as conquistas ativas do sistema
   */
  const fetchAchievements = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar todas as conquistas ativas
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (achievementsError) {
        throw achievementsError;
      }

      // Buscar progresso do usuário nas conquistas
      const { data: userAchievementsData, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', profile.id);

      if (userAchievementsError) {
        console.warn('Erro ao buscar user_achievements:', userAchievementsError);
      }

      setUserAchievements(userAchievementsData || []);

      // Combinar dados das conquistas com progresso do usuário
      const achievementsWithProgress = achievementsData?.map(achievement => {
        const userAchievement = userAchievementsData?.find(
          ua => ua.achievement_id === achievement.id
        );
        
        return {
          id: achievement.id,
          title: achievement.name || achievement.title,
          description: achievement.description,
          category: achievement.category,
          rarity: (achievement.rarity as Achievement['rarity']) || 'Comum',
          xp_reward: achievement.points || achievement.xp_reward || 0,
          icon_name: achievement.icon_name || 'Trophy',
          total_required: achievement.total_required || 1,
          unlocked: !!userAchievement?.unlocked_at,
          unlocked_date: userAchievement?.unlocked_at ? 
            new Date(userAchievement.unlocked_at).toLocaleDateString('pt-BR') : undefined,
          progress: userAchievement?.progress || 0,
          created_at: achievement.created_at
        };
      }) || [];

      setAchievements(achievementsWithProgress);
    } catch (error) {
      console.error('Erro ao buscar conquistas:', error);
      setError('Erro ao carregar conquistas');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza o progresso de uma conquista específica
   */
  const updateAchievementProgress = async (achievementId: string, progress: number) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('user_achievements')
        .upsert({
          user_id: profile.id,
          achievement_id: achievementId,
          progress,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // Recarregar conquistas após atualização
      await fetchAchievements();
    } catch (error) {
      console.error('Erro ao atualizar progresso da conquista:', error);
    }
  };

  /**
   * Desbloqueia uma conquista para o usuário
   */
  const unlockAchievement = async (achievementId: string) => {
    if (!profile?.id) return;

    try {
      const achievement = achievements.find(a => a.id === achievementId);
      if (!achievement) return;

      const { error } = await supabase
        .from('user_achievements')
        .upsert({
          user_id: profile.id,
          achievement_id: achievementId,
          progress: achievement.total_required,
          unlocked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // Recarregar conquistas após desbloqueio
      await fetchAchievements();
    } catch (error) {
      console.error('Erro ao desbloquear conquista:', error);
    }
  };

  // Carregar conquistas quando o perfil estiver disponível
  useEffect(() => {
    if (profile?.id) {
      fetchAchievements();
    }
  }, [profile?.id]);

  return {
    achievements,
    userAchievements,
    loading,
    error,
    refetch: fetchAchievements,
    updateProgress: updateAchievementProgress,
    unlockAchievement
  };
}