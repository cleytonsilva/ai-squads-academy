import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
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
  ArrowLeft,
  Share2,
  Download,
  Filter,
  BarChart3,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BadgeRanking from '@/components/badges/BadgeRanking';
import BadgeStats from '@/components/badges/BadgeStats';
import BadgeNavigation from '@/components/badges/BadgeNavigation';
import ChallengeLeaderboard from '@/components/challenges/ChallengeLeaderboard';
import ChallengeActivityFeed from '@/components/challenges/ChallengeActivityFeed';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

/**
 * Página de ranking de badges
 * Exibe rankings globais, por categoria e estatísticas
 */
export default function RankingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('global');

  // Dados simulados para estatísticas da página
  const pageStats = {
    totalUsers: 1247,
    totalBadges: 15623,
    averageLevel: 4.2,
    topStreak: 89
  };

  // Dados simulados para conquistas recentes
  const recentAchievements = [
    {
      id: '1',
      user: 'Ana Silva',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      badge: 'React Expert',
      rarity: 'epic',
      time: '2 min atrás'
    },
    {
      id: '2',
      user: 'Carlos Santos',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      badge: 'JavaScript Master',
      rarity: 'rare',
      time: '5 min atrás'
    },
    {
      id: '3',
      user: 'Maria Oliveira',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      badge: 'CSS Ninja',
      rarity: 'uncommon',
      time: '12 min atrás'
    }
  ];

  // Dados simulados para leaderboards por categoria
  const categoryLeaders = {
    programming: {
      name: 'Ana Silva',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      badges: 15,
      points: 1500
    },
    design: {
      name: 'Pedro Costa',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      badges: 12,
      points: 1200
    },
    business: {
      name: 'Julia Lima',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      badges: 10,
      points: 1000
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Ranking de Badges - AI Squads Academy',
        text: 'Confira o ranking de badges da AI Squads Academy!',
        url: window.location.href
      });
    } else {
      // Fallback para copiar URL
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleExport = () => {
    // Implementar exportação do ranking
    console.log('Exportar ranking');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  Ranking de Badges
                </h1>
                <p className="text-muted-foreground mt-1">
                  Compete com outros usuários e veja sua posição no ranking global
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Navegação de badges */}
          <div className="mt-6">
            <BadgeNavigation variant="horizontal" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar com estatísticas */}
          <div className="lg:col-span-1 space-y-6">
            {/* Estatísticas gerais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {pageStats.totalUsers.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Usuários Ativos</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {pageStats.totalBadges.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Badges Conquistados</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {pageStats.averageLevel}
                  </div>
                  <div className="text-sm text-muted-foreground">Nível Médio</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {pageStats.topStreak}
                  </div>
                  <div className="text-sm text-muted-foreground">Maior Sequência</div>
                </div>
              </CardContent>
            </Card>

            {/* Líderes por categoria */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Líderes por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(categoryLeaders).map(([category, leader]) => (
                  <div key={category} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={leader.avatar} alt={leader.name} />
                      <AvatarFallback>
                        {leader.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{leader.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {category === 'programming' ? 'Programação' : 
                         category === 'design' ? 'Design' : 'Negócios'}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-bold">{leader.badges}</div>
                      <div className="text-xs text-muted-foreground">badges</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Conquistas recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Conquistas Recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentAchievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={achievement.avatar} alt={achievement.user} />
                      <AvatarFallback>
                        {achievement.user.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {achievement.user}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            'text-xs',
                            achievement.rarity === 'epic' && 'bg-purple-100 text-purple-800',
                            achievement.rarity === 'rare' && 'bg-blue-100 text-blue-800',
                            achievement.rarity === 'uncommon' && 'bg-green-100 text-green-800'
                          )}
                        >
                          {achievement.badge}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {achievement.time}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Suas estatísticas */}
            {user && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Suas Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BadgeStats variant="compact" />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Conteúdo principal */}
          <div className="lg:col-span-3">
            <Tabs value={activeView} onValueChange={setActiveView}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="global" className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Global
                </TabsTrigger>
                <TabsTrigger value="monthly" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Mensal
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Categorias
                </TabsTrigger>
              </TabsList>

              <TabsContent value="global" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <BadgeRanking 
                      currentUserId={user?.id}
                      showCurrentUser={true}
                      limit={20}
                      period="all"
                    />
                  </div>
                  <div>
                    <ChallengeActivityFeed variant="compact" maxItems={10} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="monthly" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BadgeRanking 
                    currentUserId={user?.id}
                    showCurrentUser={true}
                    limit={20}
                    period="month"
                  />
                  <ChallengeLeaderboard variant="compact" period="monthly" maxEntries={15} />
                </div>
              </TabsContent>

              <TabsContent value="categories" className="mt-6">
                <div className="space-y-6">
                  <BadgeRanking 
                    currentUserId={user?.id}
                    showCurrentUser={true}
                    limit={20}
                    period="all"
                    showCategoryFilter={true}
                  />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Leaderboard por Categoria</CardTitle>
                        <CardDescription>
                          Rankings específicos por área de conhecimento
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChallengeLeaderboard 
                          variant="compact" 
                          period="all-time" 
                          metric="completion"
                          maxEntries={10}
                          showStats={false}
                        />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Atividades Recentes</CardTitle>
                        <CardDescription>
                          Últimas conquistas e progressos da comunidade
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChallengeActivityFeed 
                          variant="minimal" 
                          maxItems={8}
                          showFilters={false}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}