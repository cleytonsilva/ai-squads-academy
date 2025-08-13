import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Interface para desafio de badge
interface BadgeChallenge {
  id: string;
  title: string;
  description: string;
  badge_id: string;
  badge_name: string;
  badge_icon?: string;
  badge_rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirements: {
    type: 'course_completion' | 'quiz_score' | 'streak' | 'time_spent' | 'projects' | 'community';
    target: number;
    current: number;
    description: string;
  }[];
  reward_points: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category: string;
  time_limit?: string;
  participants_count: number;
  completion_rate: number;
  is_active: boolean;
  is_completed: boolean;
  is_locked: boolean;
  unlock_requirements?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Interface para participação em desafio
interface ChallengeParticipation {
  id: string;
  user_id: string;
  challenge_id: string;
  started_at: string;
  completed_at?: string;
  progress: {
    requirement_id: string;
    current_value: number;
    completed: boolean;
  }[];
  is_completed: boolean;
  points_earned?: number;
}

// Interface para estatísticas de desafios
interface ChallengeStats {
  total_challenges: number;
  active_challenges: number;
  completed_challenges: number;
  user_participations: number;
  user_completions: number;
  total_points_earned: number;
  current_streak: number;
  best_category: string;
}

// Interface para filtros
interface ChallengeFilters {
  category?: string;
  difficulty?: string;
  status?: 'active' | 'completed' | 'locked' | 'all';
  search?: string;
  rarity?: string;
}

/**
 * Hook para gerenciar desafios do usuário
 */
export function useChallenges(filters?: ChallengeFilters) {
  const [challenges, setChallenges] = useState<BadgeChallenge[]>([]);
  const [participations, setParticipations] = useState<ChallengeParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Carregar desafios
  const loadChallenges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar desafios do banco de dados
      let query = supabase
        .from('badge_challenges')
        .select(`
          *,
          badges!inner(
            name,
            image_url
          )
        `);

      // Aplicar filtros
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      
      if (filters?.difficulty && filters.difficulty !== 'all') {
        query = query.eq('difficulty', filters.difficulty);
      }
      
      if (filters?.status) {
        switch (filters.status) {
          case 'active':
            query = query.eq('is_active', true).eq('is_completed', false);
            break;
          case 'completed':
            query = query.eq('is_completed', true);
            break;
          case 'locked':
            query = query.eq('is_locked', true);
            break;
        }
      }
      
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data: challengesData, error: challengesError } = await query
        .order('created_at', { ascending: false });

      if (challengesError) {
        throw challengesError;
      }

      // Buscar participações do usuário se logado
      let userParticipations: ChallengeParticipation[] = [];
      if (user) {
        const { data: participationsData, error: participationsError } = await supabase
          .from('challenge_participations')
          .select('*')
          .eq('user_id', user.id);

        if (participationsError) {
          console.error('Erro ao carregar participações:', participationsError);
        } else {
          userParticipations = participationsData || [];
        }
      }

      // Processar dados dos desafios
      const processedChallenges = (challengesData || []).map(challenge => {
        const participation = userParticipations.find(p => p.challenge_id === challenge.id);
        
        return {
          ...challenge,
          badge_name: challenge.badges?.name || 'Badge Desconhecido',
          badge_icon: challenge.badges?.image_url,
          badge_rarity: 'common',
          is_completed: participation?.is_completed || false,
          started_at: participation?.started_at,
          completed_at: participation?.completed_at,
          requirements: challenge.requirements.map((req: any) => {
            const progressItem = participation?.progress?.find(
              (p: any) => p.requirement_id === req.id
            );
            
            return {
              ...req,
              current: progressItem?.current_value || 0
            };
          })
        };
      });

      setChallenges(processedChallenges);
      setParticipations(userParticipations);
    } catch (err) {
      console.error('Erro ao carregar desafios:', err);
      setError('Erro ao carregar desafios');
    } finally {
      setLoading(false);
    }
  }, [user, filters, supabase]);

  // Participar de um desafio
  const joinChallenge = useCallback(async (challengeId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para participar de desafios');
      return false;
    }

    try {
      // Verificar se já está participando
      const existingParticipation = participations.find(p => p.challenge_id === challengeId);
      if (existingParticipation) {
        toast.info('Você já está participando deste desafio');
        return false;
      }

      // Buscar dados do desafio
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) {
        toast.error('Desafio não encontrado');
        return false;
      }

      if (challenge.is_locked) {
        toast.error('Este desafio está bloqueado');
        return false;
      }

      // Criar participação
      const newParticipation: Partial<ChallengeParticipation> = {
        user_id: user.id,
        challenge_id: challengeId,
        started_at: new Date().toISOString(),
        progress: challenge.requirements.map(req => ({
          requirement_id: req.type,
          current_value: 0,
          completed: false
        })),
        is_completed: false
      };

      const { data, error } = await supabase
        .from('challenge_participations')
        .insert([newParticipation])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Atualizar estado local
      setParticipations(prev => [...prev, data]);
      
      // Atualizar contador de participantes
      await supabase
        .from('badge_challenges')
        .update({ 
          participants_count: challenge.participants_count + 1 
        })
        .eq('id', challengeId);

      toast.success('Você entrou no desafio com sucesso!');
      
      // Recarregar desafios para atualizar dados
      await loadChallenges();
      
      return true;
    } catch (err) {
      console.error('Erro ao participar do desafio:', err);
      toast.error('Erro ao participar do desafio');
      return false;
    }
  }, [user, participations, challenges, supabase, loadChallenges]);

  // Abandonar um desafio
  const leaveChallenge = useCallback(async (challengeId: string) => {
    if (!user) return false;

    try {
      const participation = participations.find(p => p.challenge_id === challengeId);
      if (!participation) {
        toast.error('Você não está participando deste desafio');
        return false;
      }

      if (participation.is_completed) {
        toast.error('Não é possível abandonar um desafio já concluído');
        return false;
      }

      // Remover participação
      const { error } = await supabase
        .from('challenge_participations')
        .delete()
        .eq('id', participation.id);

      if (error) {
        throw error;
      }

      // Atualizar estado local
      setParticipations(prev => prev.filter(p => p.id !== participation.id));
      
      // Atualizar contador de participantes
      const challenge = challenges.find(c => c.id === challengeId);
      if (challenge) {
        await supabase
          .from('badge_challenges')
          .update({ 
            participants_count: Math.max(0, challenge.participants_count - 1)
          })
          .eq('id', challengeId);
      }

      toast.success('Você saiu do desafio');
      
      // Recarregar desafios
      await loadChallenges();
      
      return true;
    } catch (err) {
      console.error('Erro ao abandonar desafio:', err);
      toast.error('Erro ao abandonar desafio');
      return false;
    }
  }, [user, participations, challenges, supabase, loadChallenges]);

  // Atualizar progresso de um desafio
  const updateProgress = useCallback(async (
    challengeId: string, 
    requirementType: string, 
    newValue: number
  ) => {
    if (!user) return false;

    try {
      const participation = participations.find(p => p.challenge_id === challengeId);
      if (!participation) return false;

      // Atualizar progresso
      const updatedProgress = participation.progress.map(p => {
        if (p.requirement_id === requirementType) {
          const challenge = challenges.find(c => c.id === challengeId);
          const requirement = challenge?.requirements.find(r => r.type === requirementType);
          const completed = requirement ? newValue >= requirement.target : false;
          
          return {
            ...p,
            current_value: newValue,
            completed
          };
        }
        return p;
      });

      // Verificar se o desafio foi concluído
      const allCompleted = updatedProgress.every(p => p.completed);
      const challenge = challenges.find(c => c.id === challengeId);
      
      const updateData: Partial<ChallengeParticipation> = {
        progress: updatedProgress,
        is_completed: allCompleted,
        ...(allCompleted && {
          completed_at: new Date().toISOString(),
          points_earned: challenge?.reward_points || 0
        })
      };

      const { error } = await supabase
        .from('challenge_participations')
        .update(updateData)
        .eq('id', participation.id);

      if (error) {
        throw error;
      }

      // Se concluído, conceder badge e pontos
      if (allCompleted && challenge) {
        // Conceder badge
        await supabase
          .from('user_badges')
          .insert({
            user_id: user.id,
            badge_id: challenge.badge_id,
            earned_at: new Date().toISOString(),
            earned_through: 'challenge',
            challenge_id: challengeId
          });

        // Adicionar pontos
        await supabase.rpc('add_user_points', {
          user_id: user.id,
          points: challenge.reward_points,
          source: 'challenge_completion',
          reference_id: challengeId
        });

        toast.success(`Parabéns! Você concluiu o desafio "${challenge.title}" e ganhou ${challenge.reward_points} pontos!`);
      }

      // Recarregar dados
      await loadChallenges();
      
      return true;
    } catch (err) {
      console.error('Erro ao atualizar progresso:', err);
      return false;
    }
  }, [user, participations, challenges, supabase, loadChallenges]);

  // Carregar dados iniciais
  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  return {
    challenges,
    participations,
    loading,
    error,
    joinChallenge,
    leaveChallenge,
    updateProgress,
    refetch: loadChallenges
  };
}

/**
 * Hook para estatísticas de desafios
 */
export function useChallengeStats() {
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar estatísticas gerais
      const { data: challengesData, error: challengesError } = await supabase
        .from('badge_challenges')
        .select('id, is_active, category');

      if (challengesError) {
        throw challengesError;
      }

      const totalChallenges = challengesData?.length || 0;
      const activeChallenges = challengesData?.filter(c => c.is_active).length || 0;

      let userStats = {
        user_participations: 0,
        user_completions: 0,
        total_points_earned: 0,
        current_streak: 0,
        best_category: 'Nenhuma'
      };

      if (user) {
        // Buscar participações do usuário
        const { data: participationsData, error: participationsError } = await supabase
          .from('challenge_participations')
          .select('*, badge_challenges(category, reward_points)')
          .eq('user_id', user.id);

        if (!participationsError && participationsData) {
          userStats.user_participations = participationsData.length;
          userStats.user_completions = participationsData.filter(p => p.is_completed).length;
          userStats.total_points_earned = participationsData
            .filter(p => p.is_completed)
            .reduce((sum, p) => sum + (p.points_earned || 0), 0);

          // Calcular categoria favorita
          const categoryCount: Record<string, number> = {};
          participationsData
            .filter(p => p.is_completed)
            .forEach(p => {
              const category = (p as any).badge_challenges?.category;
              if (category) {
                categoryCount[category] = (categoryCount[category] || 0) + 1;
              }
            });

          if (Object.keys(categoryCount).length > 0) {
            userStats.best_category = Object.entries(categoryCount)
              .sort(([,a], [,b]) => b - a)[0][0];
          }
        }
      }

      const finalStats: ChallengeStats = {
        total_challenges: totalChallenges,
        active_challenges: activeChallenges,
        completed_challenges: totalChallenges - activeChallenges,
        ...userStats
      };

      setStats(finalStats);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
      setError('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refetch: loadStats
  };
}

/**
 * Hook para gerenciar desafios (admin)
 */
export function useChallengeManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  // Criar novo desafio
  const createChallenge = useCallback(async (challengeData: Partial<BadgeChallenge>) => {
    if (!user) return false;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('badge_challenges')
        .insert([{
          ...challengeData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Desafio criado com sucesso!');
      return data;
    } catch (err) {
      console.error('Erro ao criar desafio:', err);
      setError('Erro ao criar desafio');
      toast.error('Erro ao criar desafio');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  // Atualizar desafio
  const updateChallenge = useCallback(async (
    challengeId: string, 
    updates: Partial<BadgeChallenge>
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('badge_challenges')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', challengeId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Desafio atualizado com sucesso!');
      return data;
    } catch (err) {
      console.error('Erro ao atualizar desafio:', err);
      setError('Erro ao atualizar desafio');
      toast.error('Erro ao atualizar desafio');
      return false;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Deletar desafio
  const deleteChallenge = useCallback(async (challengeId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se há participações ativas
      const { data: participations, error: participationsError } = await supabase
        .from('challenge_participations')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('is_completed', false);

      if (participationsError) {
        throw participationsError;
      }

      if (participations && participations.length > 0) {
        toast.error('Não é possível deletar um desafio com participações ativas');
        return false;
      }

      const { error } = await supabase
        .from('badge_challenges')
        .delete()
        .eq('id', challengeId);

      if (error) {
        throw error;
      }

      toast.success('Desafio deletado com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao deletar desafio:', err);
      setError('Erro ao deletar desafio');
      toast.error('Erro ao deletar desafio');
      return false;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  return {
    loading,
    error,
    createChallenge,
    updateChallenge,
    deleteChallenge
  };
}