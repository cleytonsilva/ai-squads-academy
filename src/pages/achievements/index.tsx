import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Trophy, 
  Target, 
  TrendingUp, 
  Star, 
  Search,
  Filter,
  Award,
  Crown,
  Flame,
  Users,
  Zap,
  Calendar,
  Gift,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AchievementDisplay from '@/components/achievements/AchievementDisplay';
import BadgeDisplay from '@/components/badges/BadgeDisplay';
import BadgeAchievements from '@/components/badges/BadgeAchievements';
import BadgeNavigation from '@/components/badges/BadgeNavigation';
import BadgeStats from '@/components/badges/BadgeStats';
import { useAuth } from '@/hooks/useAuth';

export default function AchievementsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Dados simulados de estatísticas
  const stats = {
    totalAchievements: 25,
    unlockedAchievements: 8,
    totalPoints: 2450,
    currentStreak: 5,
    longestStreak: 12,
    completedMilestones: 3,
    totalMilestones: 8,
    rarityBreakdown: {
      common: 3,
      rare: 3,
      epic: 1,
      legendary: 1
    }
  };

  // Conquistas em destaque
  const featuredAchievements = [
    {
      id: '1',
      title: 'Mestre dos Badges',
      description: 'Conquiste 50 badges únicos',
      progress: 23,
      maxProgress: 50,
      rarity: 'legendary',
      icon: <Crown className="h-6 w-6" />,
      reward: { points: 2000, title: 'Mestre dos Badges' }
    },
    {
      id: '2',
      title: 'Sequência Épica',
      description: 'Mantenha uma sequência de 30 dias',
      progress: 12,
      maxProgress: 30,
      rarity: 'epic',
      icon: <Flame className="h-6 w-6" />,
      reward: { points: 1500, badge: 'epic-streak' }
    },
    {
      id: '3',
      title: 'Líder da Comunidade',
      description: 'Seja o #1 no ranking por uma semana',
      progress: 0,
      maxProgress: 1,
      rarity: 'legendary',
      icon: <Trophy className="h-6 w-6" />,
      reward: { points: 3000, title: 'Líder Supremo' }
    }
  ];

  // Função para obter cor baseada na raridade
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">
              Você precisa estar logado para ver suas conquistas.
            </p>
            <Button onClick={() => navigate('/auth/login')}>
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Navegação */}
      <BadgeNavigation variant="horizontal" className="mb-6" />
      
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Trophy className="h-10 w-10 text-yellow-600" />
          Conquistas e Marcos
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Acompanhe seu progresso, desbloqueie conquistas épicas e alcance marcos importantes em sua jornada de aprendizado.
        </p>
      </div>
      
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unlockedAchievements}</p>
                <p className="text-sm text-muted-foreground">Conquistas</p>
                <p className="text-xs text-gray-500">
                  de {stats.totalAchievements} disponíveis
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Pontos Totais</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +250 esta semana
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
                <p className="text-sm text-muted-foreground">Sequência Atual</p>
                <p className="text-xs text-gray-500">
                  Recorde: {stats.longestStreak} dias
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedMilestones}</p>
                <p className="text-sm text-muted-foreground">Marcos</p>
                <p className="text-xs text-gray-500">
                  de {stats.totalMilestones} disponíveis
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Conquistas em Destaque */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-600" />
            Conquistas em Destaque
          </CardTitle>
          <CardDescription>
            Conquistas épicas e lendárias que você pode desbloquear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredAchievements.map((achievement) => {
              const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;
              
              return (
                <Card key={achievement.id} className="border-2 border-dashed">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                        getRarityColor(achievement.rarity)
                      }`}>
                        {achievement.icon}
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-lg">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`mt-2 ${getRarityColor(achievement.rarity)}`}
                        >
                          {achievement.rarity}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all" 
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2 text-sm text-yellow-600">
                        <Gift className="h-4 w-4" />
                        <span>+{achievement.reward.points} pontos</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Distribuição por Raridade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-purple-600" />
            Conquistas por Raridade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {stats.rarityBreakdown.common}
              </div>
              <div className="text-sm text-gray-500">Comum</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.rarityBreakdown.rare}
              </div>
              <div className="text-sm text-blue-500">Raro</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.rarityBreakdown.epic}
              </div>
              <div className="text-sm text-purple-500">Épico</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.rarityBreakdown.legendary}
              </div>
              <div className="text-sm text-yellow-500">Lendário</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="achievements">Todas as Conquistas</TabsTrigger>
          <TabsTrigger value="milestones">Marcos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Conquistas Recentes
              </h3>
              <BadgeAchievements variant="compact" maxItems={5} />
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-600" />
                Próximos Marcos
              </h3>
              <BadgeStats variant="compact" />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="achievements" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar conquistas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    <SelectItem value="milestone">Marcos</SelectItem>
                    <SelectItem value="streak">Sequências</SelectItem>
                    <SelectItem value="speed">Velocidade</SelectItem>
                    <SelectItem value="community">Comunidade</SelectItem>
                    <SelectItem value="special">Especiais</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Raridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as raridades</SelectItem>
                    <SelectItem value="common">Comum</SelectItem>
                    <SelectItem value="rare">Raro</SelectItem>
                    <SelectItem value="epic">Épico</SelectItem>
                    <SelectItem value="legendary">Lendário</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="unlocked">Conquistados</SelectItem>
                    <SelectItem value="locked">Bloqueados</SelectItem>
                    <SelectItem value="progress">Em progresso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <BadgeAchievements 
            variant="full" 
            category={selectedCategory !== 'all' ? selectedCategory : undefined}
          />
        </TabsContent>
        
        <TabsContent value="milestones" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <BadgeAchievements variant="full" />
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🎯 Próximos Marcos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>1000 Pontos</span>
                      <span>750/1000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>5 Cursos Completos</span>
                      <span>3/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>30 Dias de Sequência</span>
                      <span>12/30</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📈 Estatísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Taxa de conclusão</span>
                      <span className="text-sm font-medium">32%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pontos por conquista</span>
                      <span className="text-sm font-medium">306</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Tempo médio</span>
                      <span className="text-sm font-medium">2.5 dias</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}