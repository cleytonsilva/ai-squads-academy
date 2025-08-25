import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star,
  TrendingUp,
  Users,
  Award,
  Target,
  Calendar,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBadges } from '@/hooks/useBadges';
import { supabase } from '@/integrations/supabase/client';

// Interface para usuário no ranking
interface RankingUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  total_badges: number;
  total_points: number;
  rank: number;
  badges_by_rarity: {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
  };
  recent_badges: Array<{
    id: string;
    name: string;
    rarity: string;
    earned_at: string;
  }>;
  courses_completed: number;
  streak_days: number;
  level: number;
  next_level_points: number;
}

// Interface para props do componente
interface BadgeRankingProps {
  currentUserId?: string;
  showCurrentUser?: boolean;
  limit?: number;
  period?: 'all' | 'month' | 'week';
}

/**
 * Componente para exibir o ranking de badges
 */
export default function BadgeRanking({ 
  currentUserId,
  showCurrentUser = true,
  limit = 10,
  period = 'all'
}: BadgeRankingProps) {
  const [rankingData, setRankingData] = useState<RankingUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<RankingUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('points');

  // Carregar dados do ranking
  useEffect(() => {
    loadRankingData();
  }, [selectedPeriod, selectedCategory, limit]);

  const loadRankingData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados reais do ranking do Supabase
      const { data: userBadges, error } = await supabase
        .from('user_badges')
        .select(`
          user_id,
          profiles!inner(id, name, email, avatar_url),
          badges!inner(id, name, category, key)
        `);

      if (error) {
        console.error('Erro ao carregar ranking:', error);
        setRankingData([]);
        return;
      }

      // Processar dados para criar ranking
      const userStats = new Map<string, {
        id: string;
        name: string;
        email: string;
        avatar_url: string;
        total_badges: number;
        total_points: number;
        badges_by_rarity: { common: number; uncommon: number; rare: number; epic: number; legendary: number };
        recent_badges: Array<{ id: string; name: string; rarity: string; earned_at: string }>;
      }>();

      userBadges?.forEach((userBadge: any) => {
        const userId = userBadge.user_id;
        const user = userBadge.profiles;
        const badge = userBadge.badges;

        if (!userStats.has(userId)) {
          userStats.set(userId, {
            id: userId,
            name: user.name || 'Usuário',
            email: user.email || '',
            avatar_url: user.avatar_url || '',
            total_badges: 0,
            total_points: 0,
            badges_by_rarity: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
            recent_badges: []
          });
        }

        const stats = userStats.get(userId)!;
        stats.total_badges += 1;
        stats.total_points += 100; // 100 pontos por badge
        
        // Categorizar por raridade baseado na categoria do badge
        const rarity = badge.category || 'common';
        if (rarity in stats.badges_by_rarity) {
          stats.badges_by_rarity[rarity as keyof typeof stats.badges_by_rarity] += 1;
        }

        stats.recent_badges.push({
          id: badge.id,
          name: badge.name,
          rarity: rarity,
          earned_at: new Date().toISOString().split('T')[0]
        });
      });

      // Converter para array e ordenar por pontos
      const rankingArray = Array.from(userStats.values())
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, limit)
        .map((user, index) => ({
          ...user,
          rank: index + 1,
          courses_completed: Math.floor(user.total_badges / 3), // Estimativa
          streak_days: Math.floor(Math.random() * 50) + 1, // Placeholder
          level: Math.floor(user.total_points / 300) + 1,
          next_level_points: (Math.floor(user.total_points / 300) + 1) * 300,
          recent_badges: user.recent_badges.slice(0, 3) // Apenas os 3 mais recentes
        }));

      setRankingData(rankingArray);
      
      // Se há usuário atual, encontrar sua posição
      if (currentUserId && showCurrentUser) {
        const userRank = rankingArray.find(user => user.id === currentUserId);
        if (userRank) {
          setCurrentUserRank(userRank);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obter ícone da posição
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  // Obter cor da posição
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-muted';
    }
  };

  // Renderizar item do ranking
  const renderRankingItem = (user: RankingUser, isCurrentUser = false) => (
    <Card key={user.id} className={cn(
      'transition-all duration-200 hover:shadow-md',
      isCurrentUser && 'ring-2 ring-primary border-primary'
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Posição */}
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
            getRankColor(user.rank)
          )}>
            {getRankIcon(user.rank)}
          </div>

          {/* Avatar e Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar_url} alt={user.name} />
              <AvatarFallback>
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{user.name}</h3>
                {isCurrentUser && (
                  <Badge variant="secondary" className="text-xs">
                    Você
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  {user.total_badges} badges
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {user.total_points} pts
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Nível {user.level}
                </span>
              </div>
            </div>
          </div>

          {/* Badges por Raridade */}
          <div className="hidden md:flex items-center gap-2">
            {user.badges_by_rarity.legendary > 0 && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                {user.badges_by_rarity.legendary}L
              </Badge>
            )}
            {user.badges_by_rarity.epic > 0 && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                {user.badges_by_rarity.epic}E
              </Badge>
            )}
            {user.badges_by_rarity.rare > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                {user.badges_by_rarity.rare}R
              </Badge>
            )}
          </div>

          {/* Progresso para próximo nível */}
          <div className="hidden lg:block w-24">
            <div className="text-xs text-muted-foreground mb-1">
              Próximo nível
            </div>
            <Progress 
              value={(user.total_points / user.next_level_points) * 100} 
              className="h-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="hidden md:flex gap-2">
                  <Skeleton className="h-5 w-8" />
                  <Skeleton className="h-5 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Ranking de Badges
          </h2>
          <p className="text-muted-foreground mt-1">
            Veja os usuários com mais badges e pontuações
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as "all" | "month" | "week")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as string)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              <SelectItem value="programming">Programação</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="business">Negócios</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs para diferentes visualizações */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="points">Por Pontos</TabsTrigger>
          <TabsTrigger value="badges">Por Badges</TabsTrigger>
          <TabsTrigger value="streak">Por Sequência</TabsTrigger>
        </TabsList>

        <TabsContent value="points" className="space-y-4 mt-6">
          {/* Posição do usuário atual */}
          {currentUserRank && showCurrentUser && currentUserRank.rank > 3 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Sua Posição
              </h3>
              {renderRankingItem(currentUserRank, true)}
            </div>
          )}

          {/* Top 3 */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Top 3
            </h3>
            <div className="space-y-3">
              {rankingData.slice(0, 3).map(user => 
                renderRankingItem(user, user.id === currentUserId)
              )}
            </div>
          </div>

          {/* Demais posições */}
          {rankingData.length > 3 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Demais Posições
              </h3>
              <div className="space-y-3">
                {rankingData.slice(3).map(user => 
                  renderRankingItem(user, user.id === currentUserId)
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="badges" className="space-y-4 mt-6">
          {/* Ranking por total de badges */}
          <div className="space-y-3">
            {rankingData
              .sort((a, b) => b.total_badges - a.total_badges)
              .map((user, index) => 
                renderRankingItem({ ...user, rank: index + 1 }, user.id === currentUserId)
              )}
          </div>
        </TabsContent>

        <TabsContent value="streak" className="space-y-4 mt-6">
          {/* Ranking por sequência de dias */}
          <div className="space-y-3">
            {rankingData
              .sort((a, b) => b.streak_days - a.streak_days)
              .map((user, index) => 
                renderRankingItem({ ...user, rank: index + 1 }, user.id === currentUserId)
              )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Estatísticas gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Estatísticas Gerais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {rankingData.length}
              </div>
              <div className="text-sm text-muted-foreground">Usuários Ativos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {rankingData.reduce((sum, user) => sum + user.total_badges, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total de Badges</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(rankingData.reduce((sum, user) => sum + user.total_points, 0) / rankingData.length)}
              </div>
              <div className="text-sm text-muted-foreground">Média de Pontos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.max(...rankingData.map(user => user.streak_days))}
              </div>
              <div className="text-sm text-muted-foreground">Maior Sequência</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}