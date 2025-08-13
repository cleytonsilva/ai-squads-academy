import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  Award, 
  Target, 
  TrendingUp, 
  Calendar,
  Star,
  Medal,
  Crown
} from 'lucide-react';
import { useBadges } from '@/hooks/useBadges';
import { cn } from '@/lib/utils';

// Interface para estatísticas de badges
interface BadgeStatistics {
  totalBadges: number;
  earnedBadges: number;
  completionRate: number;
  recentBadges: number;
  rarenessCounts: {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
  };
  categoryStats: {
    category: string;
    count: number;
    total: number;
  }[];
}

// Interface para props do componente
interface BadgeStatsProps {
  userId?: string;
  className?: string;
  variant?: 'full' | 'compact' | 'minimal';
  showTrends?: boolean;
}

/**
 * Componente para exibir estatísticas detalhadas de badges
 * Mostra progresso, conquistas recentes e distribuição por categoria
 */
export default function BadgeStats({ 
  userId, 
  className, 
  variant = 'full',
  showTrends = true 
}: BadgeStatsProps) {
  const { badges, loading, error } = useBadges(userId);

  // Calcular estatísticas
  const stats: BadgeStatistics = React.useMemo(() => {
    if (!badges) {
      return {
        totalBadges: 0,
        earnedBadges: 0,
        completionRate: 0,
        recentBadges: 0,
        rarenessCounts: {
          common: 0,
          uncommon: 0,
          rare: 0,
          epic: 0,
          legendary: 0
        },
        categoryStats: []
      };
    }

    const earnedBadges = badges.filter(badge => badge.earned_at).length;
    const totalBadges = badges.length;
    const completionRate = totalBadges > 0 ? (earnedBadges / totalBadges) * 100 : 0;
    
    // Badges recentes (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentBadges = badges.filter(badge => 
      badge.earned_at && new Date(badge.earned_at) > thirtyDaysAgo
    ).length;

    // Contagem por raridade
    const rarenessCounts = badges.reduce((acc, badge) => {
      if (badge.earned_at && badge.template?.rarity) {
        acc[badge.template.rarity as keyof typeof acc]++;
      }
      return acc;
    }, {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    });

    // Estatísticas por categoria
    const categoryMap = new Map<string, { earned: number; total: number }>();
    badges.forEach(badge => {
      const category = badge.template?.category || 'Outros';
      const current = categoryMap.get(category) || { earned: 0, total: 0 };
      current.total++;
      if (badge.earned_at) current.earned++;
      categoryMap.set(category, current);
    });

    const categoryStats = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      count: stats.earned,
      total: stats.total
    }));

    return {
      totalBadges,
      earnedBadges,
      completionRate,
      recentBadges,
      rarenessCounts,
      categoryStats
    };
  }, [badges]);

  // Componente de loading
  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-destructive text-sm">Erro ao carregar estatísticas</p>
        </CardContent>
      </Card>
    );
  }

  // Renderização minimal
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium">{stats.earnedBadges}</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-500" />
          <span className="text-sm">{stats.completionRate.toFixed(0)}%</span>
        </div>
      </div>
    );
  }

  // Renderização compact
  if (variant === 'compact') {
    return (
      <div className={cn('grid grid-cols-2 gap-4', className)}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.earnedBadges}</p>
                <p className="text-xs text-muted-foreground">Badges Conquistados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.completionRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Conclusão</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Renderização completa
  return (
    <div className={cn('space-y-6', className)}>
      {/* Estatísticas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.earnedBadges}</p>
                <p className="text-xs text-muted-foreground">Badges Conquistados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalBadges}</p>
                <p className="text-xs text-muted-foreground">Total Disponível</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.completionRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Conclusão</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.recentBadges}</p>
                <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progresso Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progresso Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Badges Conquistados</span>
              <span>{stats.earnedBadges} de {stats.totalBadges}</span>
            </div>
            <Progress value={stats.completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Distribuição por Raridade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Badges por Raridade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Comum</span>
              </div>
              <p className="text-2xl font-bold">{stats.rarenessCounts.common}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Incomum</span>
              </div>
              <p className="text-2xl font-bold">{stats.rarenessCounts.uncommon}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Raro</span>
              </div>
              <p className="text-2xl font-bold">{stats.rarenessCounts.rare}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Medal className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Épico</span>
              </div>
              <p className="text-2xl font-bold">{stats.rarenessCounts.epic}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Lendário</span>
              </div>
              <p className="text-2xl font-bold">{stats.rarenessCounts.legendary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progresso por Categoria */}
      {stats.categoryStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progresso por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.categoryStats.map((category) => {
                const percentage = category.total > 0 ? (category.count / category.total) * 100 : 0;
                return (
                  <div key={category.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{category.category}</span>
                      <span>{category.count} de {category.total}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}