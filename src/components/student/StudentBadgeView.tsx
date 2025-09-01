import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Award, 
  Star, 
  Trophy, 
  Target, 
  Clock, 
  CheckCircle,
  Lock,
  TrendingUp,
  Calendar,
  Share2,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge: {
    id: string;
    name: string;
    description: string;
    image_url: string;
    style: any;
    category: string;
    key: string;
  };
}

interface BadgeProgress {
  badge_id: string;
  current_points: number;
  required_points: number;
  progress_percentage: number;
  is_completed: boolean;
}

interface BadgeChallenge {
  id: string;
  title: string;
  description: string;
  badge_id: string;
  requirements: any;
  points_reward: number;
  is_active: boolean;
}

/**
 * Componente para visualização de badges - APENAS PARA ESTUDANTES
 * Estudantes visualizam seus badges conquistados e progresso
 */
export default function StudentBadgeView() {
  const { toast } = useToast();
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [availableChallenges, setAvailableChallenges] = useState<BadgeChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Ícones disponíveis
  const availableIcons = {
    award: Award,
    star: Star,
    trophy: Trophy,
    target: Target,
    clock: Clock,
    check: CheckCircle,
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Verificar usuário autenticado
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
        return;
      }
      
      setUser(authUser);
      
      await Promise.all([
        loadUserBadges(authUser.id),
        loadBadgeProgress(authUser.id),
        loadAvailableChallenges()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({ title: "Erro", description: "Erro ao carregar dados do usuário", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadUserBadges = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!profile) return;

    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        id,
        user_id,
        badge_id,
        earned_at,
        badge:badges (
          id,
          name,
          description,
          image_url,
          style,
          category,
          key
        )
      `)
      .eq('user_id', profile.id)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar badges:', error);
      return;
    }

    setUserBadges(data || []);
  };

  const loadBadgeProgress = async (userId: string) => {
    // Simular progresso de badges baseado em pontos do usuário
    // Em uma implementação real, isso viria de uma view ou função do banco
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, points')
      .eq('user_id', userId)
      .single();

    if (!profile) return;

    const { data: allBadges } = await supabase
      .from('badges')
      .select('id, name, category, key')
      .not('key', 'is', null);

    if (!allBadges) return;

    const userPoints = profile.points || 0;
    const progress = allBadges.map(badge => ({
      badge_id: badge.id,
      current_points: userPoints,
      required_points: 100, // Valor padrão para pontos necessários
      progress_percentage: Math.min(userPoints, 100),
      is_completed: userPoints >= 100
    }));

    setBadgeProgress(progress);
  };

  const loadAvailableChallenges = async () => {
    // Carregar desafios de badges disponíveis
    const { data, error } = await supabase
      .from('badge_challenges')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar desafios:', error);
      return;
    }

    setAvailableChallenges(data || []);
  };

  const getIconComponent = (style: any) => {
    // Extrair ícone do style JSON ou usar Award como padrão
    const iconName = style?.icon || 'award';
    return availableIcons[iconName as keyof typeof availableIcons] || Award;
  };

  const shareAchievement = async (badge: UserBadge) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Conquistei o badge: ${badge.badge.name}`,
          text: `Acabei de conquistar o badge "${badge.badge.name}" na AI Squads Academy! 🏆`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback para copiar para clipboard
      const text = `Conquistei o badge "${badge.badge.name}" na AI Squads Academy! 🏆`;
      navigator.clipboard.writeText(text);
      toast({ title: "Sucesso", description: "Texto copiado para a área de transferência!" });
    }
  };

  const downloadCertificate = async (badge: UserBadge) => {
    // Implementar download de certificado do badge
    toast.info('Funcionalidade de download em desenvolvimento');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const earnedBadgesByCategory = userBadges.reduce((acc, userBadge) => {
    const category = userBadge.badge.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(userBadge);
    return acc;
  }, {} as Record<string, UserBadge[]>);

  const totalPoints = userBadges.length * 100; // Assumindo 100 pontos por badge
  const completionRate = badgeProgress.length > 0 
    ? Math.round((userBadges.length / badgeProgress.length) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header com estatísticas do usuário */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Conquistados</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userBadges.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de conquistas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Totais</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              Pontos de badges
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Badges disponíveis
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Badge</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userBadges.length > 0 
                ? new Date(userBadges[0].earned_at).toLocaleDateString('pt-BR')
                : '--'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Data da conquista
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes visualizações */}
      <Tabs defaultValue="earned" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="earned">Badges Conquistados</TabsTrigger>
          <TabsTrigger value="progress">Progresso</TabsTrigger>
          <TabsTrigger value="challenges">Desafios</TabsTrigger>
        </TabsList>

        <TabsContent value="earned" className="space-y-4">
          {userBadges.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum badge conquistado ainda</h3>
                <p className="text-muted-foreground text-center">
                  Complete cursos e desafios para conquistar seus primeiros badges!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(earnedBadgesByCategory).map(([category, badges]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold mb-4 capitalize">
                    {category === 'achievement' ? 'Conquistas' :
                     category === 'course' ? 'Cursos' :
                     category === 'challenge' ? 'Desafios' :
                     category === 'participation' ? 'Participação' :
                     category === 'milestone' ? 'Marcos' : category}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {badges.map((userBadge) => {
                      const IconComponent = getIconComponent(userBadge.badge.style);
                      const badgeColor = userBadge.badge.style?.color || '#3B82F6';
                      return (
                        <Card key={userBadge.id} className="relative">
                          <CardHeader className="pb-3">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="p-3 rounded-lg"
                                style={{ 
                                  backgroundColor: badgeColor + '20', 
                                  color: badgeColor 
                                }}
                              >
                                <IconComponent className="h-6 w-6" />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-lg">{userBadge.badge.name}</CardTitle>
                                <Badge variant="secondary" className="text-xs">
                                  {userBadge.badge.key || 'Badge'}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                              {userBadge.badge.description}
                            </p>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Conquistado em {new Date(userBadge.earned_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => shareAchievement(userBadge)}
                                className="flex-1"
                              >
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartilhar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadCertificate(userBadge)}
                                className="flex-1"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Certificado
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid gap-4">
            {badgeProgress
              .filter(progress => !progress.is_completed)
              .map((progress) => {
                const badge = badgeProgress.find(p => p.badge_id === progress.badge_id);
                return (
                  <Card key={progress.badge_id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Badge em Progresso</h3>
                            <p className="text-sm text-muted-foreground">
                              {progress.current_points} / {progress.required_points} pontos
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {Math.round(progress.progress_percentage)}%
                        </Badge>
                      </div>
                      
                      <Progress 
                        value={progress.progress_percentage} 
                        className="h-2"
                      />
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        Faltam {progress.required_points - progress.current_points} pontos para conquistar
                      </p>
                    </CardContent>
                  </Card>
                );
              })
            }
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {availableChallenges.map((challenge) => (
              <Card key={challenge.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>{challenge.title}</span>
                  </CardTitle>
                  <CardDescription>
                    {challenge.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      +{challenge.points_reward} pontos
                    </Badge>
                    <Button size="sm">
                      Participar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}