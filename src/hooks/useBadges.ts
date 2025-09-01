import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

// Interfaces para tipagem
interface BadgeTemplate {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  key: string | null;
  style: any;
  category?: string;
  is_active?: boolean;
  color?: string;
  criteria?: string;
  course_id?: string;
  created_at: string;
  updated_at: string;
  category?: string;
}

interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  source: string | null;
  created_at: string;
  badge: BadgeTemplate;
}

interface BadgeProgress {
  badge_id: string;
  current_points: number;
  required_points: number;
  progress_percentage: number;
  is_earned: boolean;
}

/**
 * Hook para gerenciar badges do usuário (APENAS PARA ALUNOS)
 */
export function useBadges(userId?: string) {
  const { user, profile } = useAuth();
  const targetUserId = userId || user?.id;
  
  // Verificar se é admin - admins não devem usar este hook para badges pessoais
  const isAdmin = profile?.role === 'admin';
  
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [availableBadges, setAvailableBadges] = useState<BadgeTemplate[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega badges do usuário (apenas para alunos)
   */
  const loadUserBadges = async () => {
    if (!targetUserId || isAdmin) {
      setBadges([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query corrigida: user_badges tem foreign key para badges, não o contrário
      const { data, error: badgesError } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges!inner (
            id,
            name,
            description,
            image_url,
            key,
            style,
            created_at,
            updated_at,
            category
          )
        `)
        .eq('user_id', targetUserId)
        .order('awarded_at', { ascending: false });

      if (badgesError) throw badgesError;

      // Ajustar estrutura para compatibilidade
      const processedBadges = (data || []).map(item => ({
        ...item,
        badge: item.badges
      }));

      setBadges(processedBadges);
    } catch (err) {
      console.error('Erro ao carregar badges do usuário:', err);
      setError('Erro ao carregar badges');
      if (!isAdmin) { // Só mostra erro se não for admin
        toast({
          title: "Erro",
          description: "Erro ao carregar badges do usuário",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carrega todos os badges disponíveis
   */
  const loadAvailableBadges = async () => {
    try {
      const { data, error: templatesError } = await supabase
        .from('badges')
        .select('*')
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      setAvailableBadges(data || []);
    } catch (err) {
      console.error('Erro ao carregar badges disponíveis:', err);
      setError('Erro ao carregar badges disponíveis');
    }
  };

  /**
   * Calcula progresso dos badges
   */
  const calculateBadgeProgress = async () => {
    if (!targetUserId || availableBadges.length === 0) return;

    try {
      // Buscar pontos do usuário (simulado - implementar lógica real)
      const userPoints = await getUserPoints(targetUserId);
      
      // Buscar badges já conquistados
      const earnedBadgeIds = badges.map(badge => badge.badge_id);

      const progress: BadgeProgress[] = availableBadges.map(template => {
        const isEarned = earnedBadgeIds.includes(template.id);
        const currentPoints = userPoints;
        const requiredPoints = 100; // Valor padrão para todos os badges
        const progressPercentage = Math.min((currentPoints / requiredPoints) * 100, 100);

        return {
          badge_id: template.id,
          current_points: currentPoints,
          required_points: requiredPoints,
          progress_percentage: progressPercentage,
          is_earned: isEarned,
        };
      });

      setBadgeProgress(progress);
    } catch (err) {
      console.error('Erro ao calcular progresso dos badges:', err);
    }
  };

  /**
   * Busca pontos do usuário (implementação simulada)
   */
  const getUserPoints = async (userId: string): Promise<number> => {
    try {
      // Buscar pontos baseado em conclusões de cursos, quizzes, etc.
      const { data: completions, error } = await supabase
        .from('course_completions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Cada curso concluído = 100 pontos (exemplo)
      const coursePoints = (completions?.length || 0) * 100;

      // Buscar pontos de quizzes
      const { data: quizAttempts, error: quizError } = await supabase
        .from('quiz_attempts')
        .select('score')
        .eq('user_id', userId)
        .eq('is_passed', true);

      if (quizError) throw quizError;

      const quizPoints = quizAttempts?.reduce((total, attempt) => total + (attempt.score || 0), 0) || 0;

      return coursePoints + quizPoints;
    } catch (err) {
      console.error('Erro ao buscar pontos do usuário:', err);
      return 0;
    }
  };

  /**
   * Concede um badge ao usuário
   */
  const awardBadge = async (badgeTemplateId: string, userId?: string) => {
    const targetUser = userId || targetUserId;
    if (!targetUser) {
      toast({
        title: "Erro",
        description: "Usuário não identificado",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Verificar se o usuário já possui o badge
      const { data: existingBadge, error: checkError } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', targetUser)
        .eq('badge_id', badgeTemplateId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingBadge) {
        toast({
          title: "Info",
          description: "Usuário já possui este badge"
        });
        return false;
      }

      // Conceder o badge
      const { error: insertError } = await supabase
        .from('user_badges')
        .insert({
          user_id: targetUser,
          badge_id: badgeTemplateId,
          awarded_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      toast({
        title: "Sucesso",
        description: "Badge concedido com sucesso!"
      });
      
      // Recarregar badges se for o usuário atual
      if (targetUser === targetUserId) {
        await loadUserBadges();
      }

      return true;
    } catch (err) {
      console.error('Erro ao conceder badge:', err);
      toast({
        title: "Erro",
        description: "Erro ao conceder badge",
        variant: "destructive"
      });
      return false;
    }
  };

  /**
   * Verifica automaticamente se o usuário merece novos badges
   */
  const checkForNewBadges = async () => {
    if (!targetUserId || availableBadges.length === 0) return;

    try {
      const userPoints = await getUserPoints(targetUserId);
      const earnedBadgeIds = badges.map(badge => badge.badge_id);

      // Verificar badges que o usuário pode conquistar
      const eligibleBadges = availableBadges.filter(template => {
        const required = 100; // Valor padrão para todos os badges
        return !earnedBadgeIds.includes(template.id) && userPoints >= required;
      });

      // Conceder badges automaticamente
      for (const badge of eligibleBadges) {
        await awardBadge(badge.id);
      }

      if (eligibleBadges.length > 0) {
        toast({
          title: "Parabéns!",
          description: `Você conquistou ${eligibleBadges.length} novo(s) badge(s)!`
        });
      }
    } catch (err) {
      console.error('Erro ao verificar novos badges:', err);
    }
  };

  /**
   * Busca badges por curso
   */
  const getBadgesByCourse = (_courseId: string) => {
    // O esquema atual de badges não inclui relação direta com curso
    return badges;
  };

  /**
   * Busca templates de badges por curso
   */
  const getAvailableBadgesByCourse = (_courseId: string) => {
    // O esquema atual de badges não inclui relação direta com curso
    return availableBadges;
  };

  /**
   * Busca progresso de um badge específico
   */
  const getBadgeProgress = (badgeId: string) => {
    return badgeProgress.find(progress => progress.badge_id === badgeId);
  };

  /**
   * Verifica se o usuário possui um badge específico
   */
  const hasBadge = (badgeId: string) => {
    return badges.some(badge => badge.badge_id === badgeId);
  };

  /**
   * Carrega dados iniciais
   */
  useEffect(() => {
    if (targetUserId) {
      loadUserBadges();
      loadAvailableBadges();
    }
  }, [targetUserId]);

  /**
   * Calcula progresso quando badges e templates estão carregados
   */
  useEffect(() => {
    if (badges.length >= 0 && availableBadges.length > 0) {
      calculateBadgeProgress();
    }
  }, [badges, availableBadges]);

  return {
    // Estados
    badges,
    availableBadges,
    badgeProgress,
    loading,
    error,
    
    // Funções
    loadUserBadges,
    loadAvailableBadges,
    awardBadge,
    checkForNewBadges,
    getBadgesByCourse,
    getAvailableBadgesByCourse,
    getBadgeProgress,
    hasBadge,
    
    // Estatísticas
    totalBadges: badges.length,
    totalAvailableBadges: availableBadges.length,
    completionRate: availableBadges.length > 0 ? (badges.length / availableBadges.length) * 100 : 0,
  };
}

/**
 * Hook para gerenciar todos os badges (admin)
 */
export function useAllBadges() {
  const [allUserBadges, setAllUserBadges] = useState<UserBadge[]>([]);
  const [badgeTemplates, setBadgeTemplates] = useState<BadgeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega todos os badges de todos os usuários
   */
  const loadAllUserBadges = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: badgesError } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*),
          user:profiles(full_name, email)
        `)
        .order('awarded_at', { ascending: false });

      if (badgesError) throw badgesError;

      setAllUserBadges(data || []);
    } catch (err) {
      console.error('Erro ao carregar todos os badges:', err);
      setError('Erro ao carregar badges');
      toast({
        title: "Erro",
        description: "Erro ao carregar badges",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carrega templates de badges
   */
  const loadBadgeTemplates = async () => {
    try {
      const { data, error: templatesError } = await supabase
        .from('badges')
        .select(`
          *
        `)
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      setBadgeTemplates(data || []);
    } catch (err) {
      console.error('Erro ao carregar templates de badges:', err);
      setError('Erro ao carregar templates');
    }
  };

  /**
   * Revoga um badge de um usuário
   */
  const revokeBadge = async (userBadgeId: string) => {
    try {
      const { error } = await supabase
        .from('user_badges')
        .delete()
        .eq('id', userBadgeId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Badge revogado com sucesso!"
      });
      await loadAllUserBadges();
      return true;
    } catch (err) {
      console.error('Erro ao revogar badge:', err);
      toast({
        title: "Erro",
        description: "Erro ao revogar badge",
        variant: "destructive"
      });
      return false;
    }
  };

  /**
   * Busca badges por template
   */
  const getBadgesByTemplate = (templateId: string) => {
    return allUserBadges.filter(badge => badge.badge_id === templateId);
  };

  /**
   * Busca estatísticas de um template
   */
  const getTemplateStats = (templateId: string) => {
    const badgesEarned = getBadgesByTemplate(templateId).length;
    return {
      totalEarned: badgesEarned,
      popularityRank: 0, // TODO: Implementar ranking
    };
  };

  useEffect(() => {
    loadAllUserBadges();
    loadBadgeTemplates();
  }, []);

  return {
    // Estados
    allUserBadges,
    badgeTemplates,
    loading,
    error,
    
    // Funções
    loadAllUserBadges,
    loadBadgeTemplates,
    revokeBadge,
    getBadgesByTemplate,
    getTemplateStats,
    
    // Estatísticas
    totalBadgesEarned: allUserBadges.length,
    totalTemplates: badgeTemplates.length,
    averageBadgesPerUser: 0, // TODO: Calcular média
  };
}

/**
 * Hook para gerenciar templates de badges
 */
export function useBadgeTemplates() {
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega templates
   */
  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: templatesError } = await supabase
        .from('badge_templates')
        .select(`
          *,
          course:courses(title)
        `)
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      setTemplates(data || []);
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
      setError('Erro ao carregar templates');
      toast({
        title: "Erro",
        description: "Erro ao carregar templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cria novo template
   */
  const createTemplate = async (templateData: Omit<BadgeTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .insert([templateData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Template de badge criado!"
      });
      await loadTemplates();
      return data;
    } catch (err) {
      console.error('Erro ao criar template:', err);
      toast({
        title: "Erro",
        description: "Erro ao criar template",
        variant: "destructive"
      });
      return null;
    }
  };

  /**
   * Atualiza template
   */
  const updateTemplate = async (id: string, templateData: Partial<BadgeTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .update(templateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Template atualizado!"
      });
      await loadTemplates();
      return data;
    } catch (err) {
      console.error('Erro ao atualizar template:', err);
      toast({
        title: "Erro",
        description: "Erro ao atualizar template",
        variant: "destructive"
      });
      return null;
    }
  };

  /**
   * Deleta template
   */
  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Template deletado!"
      });
      await loadTemplates();
      return true;
    } catch (err) {
      console.error('Erro ao deletar template:', err);
      toast({
        title: "Erro",
        description: "Erro ao deletar template",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}