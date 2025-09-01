import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";
import type {
  Challenge,
  ChallengeParticipation,
  ChallengeWithParticipation,
  UseChallengesReturn,
  DifficultyLevel,
  ChallengeType,
  ChallengeStatus,
  BadgeTemplate,
  UserBadge
} from '@/types';

// Interface para desafio de badge (compatibilidade)
interface BadgeChallenge extends Challenge {
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
  is_completed: boolean;
  is_locked: boolean;
  unlock_requirements?: string;
  started_at?: string;
  completed_at?: string;
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
export function useChallenges(filters?: ChallengeFilters): UseChallengesReturn {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userParticipations, setUserParticipations] = useState<ChallengeParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Carregar desafios
  const loadChallenges = useCallback(async () => {
    try {
      setError(null);

      // Buscar desafios de badges com tratamento de erro robusto
      let query = supabase
        .from('badge_challenges')
        .select(`
          *,
          badges:badge_id(
            id,
            name,
            description,
            icon_url,
            image_url
          )
        `);

      // Aplicar filtros apenas se as colunas existirem
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters?.difficulty && filters.difficulty !== 'all') {
        query = query.eq('difficulty', filters.difficulty);
      }

      if (filters?.status !== undefined && filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active');
      }

      if (filters?.search) {
        // Usar busca mais simples para evitar erros de sintaxe
        query = query.ilike('description', `%${filters.search}%`);
      }

      const { data: challengesData, error: challengesError } = await query
        .order('created_at', { ascending: false });

      if (challengesError) {
        console.error('Erro ao buscar desafios:', challengesError);
        // Se houver erro, definir dados vazios em vez de falhar
        setChallenges([]);
        setUserParticipations([]);
        return;
      }

      // Buscar participações do usuário se logado
      let participationsData: ChallengeParticipation[] = [];
      if (user) {
        const { data: userParticipationsData, error: participationsError } = await supabase
          .from('challenge_participations')
          .select('*')
          .eq('user_id', user.id);

        if (participationsError) {
          console.error('Erro ao carregar participações:', participationsError);
          // Continuar sem participações em caso de erro
        } else {
          participationsData = userParticipationsData || [];
        }
      }

      // Processar dados dos desafios com valores padrão seguros
      const processedChallenges = challengesData?.map(challenge => {
        const participation = participationsData.find(p => p.challenge_id === challenge.id);
        
        return {
          ...challenge,
          badge_name: challenge.badges?.name || 'Badge Desconhecido',
          badge_icon: challenge.badges?.icon_url,
          badge_rarity: 'common' as const,
          requirements: Array.isArray(challenge.requirements) ? challenge.requirements.map((req: any) => {
            const progressItem = participation?.progress?.find(
              (p: any) => p.requirement_id === req.id
            );
            
            return {
              ...req,
              current: progressItem?.current_value || 0
            };
          }) : [],
          reward_points: challenge.reward_points || 0,
          difficulty: challenge.difficulty || 'easy',
          category: challenge.category || 'general',
          time_limit: challenge.time_limit,
          participants_count: 0, // TODO: calcular participantes reais
          completion_rate: 0, // TODO: calcular taxa de conclusão real
          is_completed: participation?.is_completed || false,
          started_at: participation?.started_at,
          completed_at: participation?.completed_at
        };
      }) || [];

      setChallenges(processedChallenges);
      setUserParticipations(participationsData);
    } catch (err: any) {
      console.error('Erro ao carregar desafios:', err);
      setError(err.message || 'Erro ao carregar desafios');
      // Definir dados vazios em caso de erro para evitar comportamento intermitente
      setChallenges([]);
      setUserParticipations([]);
    } finally {
      setLoading(false);
    }
  }, [user, filters, supabase]);

  // Participar de um desafio
  const joinChallenge = useCallback(async (challengeId: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para participar de desafios",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Verificar se já está participando
      const existingParticipation = userParticipations.find(p => p.challenge_id === challengeId);
      if (existingParticipation) {
        toast({
          title: "Informação",
          description: "Você já está participando deste desafio",
        });
        return false;
      }

      // Buscar dados do desafio
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) {
        toast({
          title: "Erro",
          description: "Desafio não encontrado",
          variant: "destructive",
        });
        return false;
      }

      if (challenge.is_locked) {
        toast({
          title: "Erro",
          description: "Este desafio está bloqueado",
          variant: "destructive",
        });
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
      setUserParticipations(prev => [...prev, data]);
      
      // Atualizar contador de participantes
      await supabase
        .from('badge_challenges')
        .update({ 
          participants_count: challenge.participants_count + 1 
        })
        .eq('id', challengeId);

      toast({
        title: "Sucesso",
        description: "Você entrou no desafio com sucesso!",
      });
      
      // Recarregar desafios para atualizar dados
      await loadChallenges();
      
      return true;
    } catch (err) {
      console.error('Erro ao participar do desafio:', err);
      toast({
        title: "Erro",
        description: "Erro ao participar do desafio",
        variant: "destructive",
      });
      return false;
    }
  }, [user, userParticipations, challenges, supabase, loadChallenges]);

  // Abandonar um desafio
  const leaveChallenge = useCallback(async (challengeId: string) => {
    if (!user) return false;

    try {
      const participation = userParticipations.find(p => p.challenge_id === challengeId);
      if (!participation) {
        toast({
          title: "Erro",
          description: "Você não está participando deste desafio",
          variant: "destructive",
        });
        return false;
      }

      if (participation.is_completed) {
        toast({
          title: "Erro",
          description: "Não é possível abandonar um desafio já concluído",
          variant: "destructive",
        });
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
      setUserParticipations(prev => prev.filter(p => p.id !== participation.id));
      
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

      toast({
        title: "Sucesso",
        description: "Você saiu do desafio",
      });
      
      // Recarregar desafios
      await loadChallenges();
      
      return true;
    } catch (err) {
      console.error('Erro ao abandonar desafio:', err);
      toast({
        title: "Erro",
        description: "Erro ao abandonar desafio",
        variant: "destructive",
      });
      return false;
    }
  }, [user, userParticipations, challenges, supabase, loadChallenges]);

  // Atualizar progresso de um desafio
  const updateProgress = useCallback(async (
    challengeId: string, 
    requirementType: string, 
    newValue: number
  ) => {
    if (!user) return false;

    try {
      const participation = userParticipations.find(p => p.challenge_id === challengeId);
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

        toast({
          title: "Parabéns!",
          description: `Você concluiu o desafio "${challenge.title}" e ganhou ${challenge.reward_points} pontos!`,
        });
      }

      // Recarregar dados
      await loadChallenges();
      
      return true;
    } catch (err) {
      console.error('Erro ao atualizar progresso:', err);
      return false;
    }
  }, [user, userParticipations, challenges, supabase, loadChallenges]);

  // Carregar dados iniciais
  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  return {
    challenges,
    userParticipations,
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
  // supabase já está importado no topo do arquivo

  const loadStats = useCallback(async () => {
    try {
      setError(null);

      // Buscar estatísticas gerais com tratamento de erro robusto
      const { data: challengesData, error: challengesError } = await supabase
        .from('badge_challenges')
        .select('id, is_active, category');

      if (challengesError) {
        console.error('Erro ao buscar estatísticas de desafios:', challengesError);
        // Definir estatísticas padrão em caso de erro
        setStats({
          total_challenges: 0,
          active_challenges: 0,
          completed_challenges: 0,
          user_participations: 0,
          user_completions: 0,
          total_points_earned: 0,
          current_streak: 0,
          best_category: 'Nenhuma'
        });
        return;
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
        // Buscar participações do usuário com tratamento de erro
        const { data: participationsData, error: participationsError } = await supabase
          .from('challenge_participations')
          .select('*, badge_challenges(category)')
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
        } else if (participationsError) {
          console.error('Erro ao buscar participações do usuário:', participationsError);
        }
      }

      const finalStats: ChallengeStats = {
        total_challenges: totalChallenges,
        active_challenges: activeChallenges,
        completed_challenges: totalChallenges - activeChallenges,
        ...userStats
      };

      setStats(finalStats);
    } catch (err: any) {
      console.error('Erro ao carregar estatísticas:', err);
      setError(err.message || 'Erro ao carregar estatísticas');
      // Definir estatísticas padrão em caso de erro
      setStats({
        total_challenges: 0,
        active_challenges: 0,
        completed_challenges: 0,
        user_participations: 0,
        user_completions: 0,
        total_points_earned: 0,
        current_streak: 0,
        best_category: 'Nenhuma'
      });
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
  const { toast } = useToast();
  // supabase já está importado no topo do arquivo

  // Criar novo desafio
  const createChallenge = useCallback(async (challengeData: Partial<Challenge>) => {
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

      toast({
        title: "Sucesso",
        description: "Desafio criado com sucesso!",
      });
      return data;
    } catch (err) {
      console.error('Erro ao criar desafio:', err);
      setError('Erro ao criar desafio');
      toast({
        title: "Erro",
        description: "Erro ao criar desafio",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  // Atualizar desafio
  const updateChallenge = useCallback(async (
    challengeId: string, 
    updates: Partial<Challenge>
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

      toast({
        title: "Sucesso",
        description: "Desafio atualizado com sucesso!",
      });
      return data;
    } catch (err) {
      console.error('Erro ao atualizar desafio:', err);
      setError('Erro ao atualizar desafio');
      toast({
        title: "Erro",
        description: "Erro ao atualizar desafio",
        variant: "destructive",
      });
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
        toast({
          title: "Erro",
          description: "Não é possível deletar um desafio com participações ativas",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('badge_challenges')
        .delete()
        .eq('id', challengeId);

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Desafio deletado com sucesso!",
      });
      return true;
    } catch (err) {
      console.error('Erro ao deletar desafio:', err);
      setError('Erro ao deletar desafio');
      toast({
        title: "Erro",
        description: "Erro ao deletar desafio",
        variant: "destructive",
      });
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