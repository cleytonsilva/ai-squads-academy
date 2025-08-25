import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Trophy, 
  Star, 
  Target, 
  Calendar, 
  Zap, 
  Award, 
  Crown, 
  Flame,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  Lock,
  Gift
} from 'lucide-react';
import { useBadges } from '@/hooks/useBadges';

// Interface para conquistas
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'milestone' | 'streak' | 'special' | 'community' | 'speed';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  reward: {
    points: number;
    badges?: string[];
    title?: string;
  };
  requirements: string[];
}

// Interface para marcos
interface Milestone {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  category: 'badges' | 'points' | 'courses' | 'challenges' | 'streak';
  icon: React.ReactNode;
  reward: {
    points: number;
    badge?: string;
    title?: string;
  };
  isCompleted: boolean;
  completedAt?: Date;
}

interface BadgeAchievementsProps {
  variant?: 'full' | 'compact' | 'minimal';
  showProgress?: boolean;
  showRewards?: boolean;
  maxItems?: number;
  category?: string;
}

export default function BadgeAchievements({
  variant = 'full',
  showProgress = true,
  showRewards = true,
  maxItems,
  category
}: BadgeAchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [activeTab, setActiveTab] = useState('achievements');
  const [loading, setLoading] = useState(true);
  
  const { badges, userBadges } = useBadges();

  // Carregar conquistas baseadas nos badges reais do usuário
  useEffect(() => {
    const loadAchievements = async () => {
      setLoading(true);
      
      // Criar conquistas baseadas nos badges do usuário
      const userBadgeCount = userBadges?.length || 0;
      const totalBadges = badges?.length || 0;
      
      const dynamicAchievements: Achievement[] = [
        {
          id: '1',
          title: 'Primeiro Passo',
          description: 'Conquiste seu primeiro badge',
          icon: <Star className="h-5 w-5" />,
          category: 'milestone',
          rarity: 'common',
          progress: Math.min(userBadgeCount, 1),
          maxProgress: 1,
          isUnlocked: userBadgeCount >= 1,
          unlockedAt: userBadgeCount >= 1 ? new Date() : undefined,
          reward: { points: 100, badges: ['first-badge'] },
          requirements: ['Conquistar 1 badge']
        },
        {
          id: '2',
          title: 'Colecionador',
          description: 'Conquiste 5 badges diferentes',
          icon: <Trophy className="h-5 w-5" />,
          category: 'milestone',
          rarity: 'rare',
          progress: Math.min(userBadgeCount, 5),
          maxProgress: 5,
          isUnlocked: userBadgeCount >= 5,
          reward: { points: 500, title: 'Colecionador' },
          requirements: ['Conquistar 5 badges únicos']
        },
        {
          id: '3',
          title: 'Especialista',
          description: 'Conquiste 10 badges diferentes',
          icon: <Crown className="h-5 w-5" />,
          category: 'milestone',
          rarity: 'epic',
          progress: Math.min(userBadgeCount, 10),
          maxProgress: 10,
          isUnlocked: userBadgeCount >= 10,
          reward: { points: 1000, title: 'Especialista' },
          requirements: ['Conquistar 10 badges únicos']
        }
      ];

      // Criar marcos baseados nos dados reais
      const dynamicMilestones: Milestone[] = [
        {
          id: '1',
          title: 'Pontos Acumulados',
          description: 'Acumule pontos através de badges',
          targetValue: 1000,
          currentValue: userBadgeCount * 100, // 100 pontos por badge
          category: 'points',
          icon: <Star className="h-5 w-5" />,
          reward: { points: 200, badge: 'point-master' },
          isCompleted: (userBadgeCount * 100) >= 1000
        },
        {
          id: '2',
          title: 'Coleção Completa',
          description: `Conquiste todos os ${totalBadges} badges disponíveis`,
          targetValue: totalBadges,
          currentValue: userBadgeCount,
          category: 'badges',
          icon: <Trophy className="h-5 w-5" />,
          reward: { points: 2000, title: 'Mestre dos Badges' },
          isCompleted: userBadgeCount >= totalBadges && totalBadges > 0
        }
      ];

      // Filtrar por categoria se especificada
      const filteredAchievements = category 
        ? dynamicAchievements.filter(a => a.category === category)
        : dynamicAchievements;

      // Aplicar limite se especificado
      const limitedAchievements = maxItems 
        ? filteredAchievements.slice(0, maxItems)
        : filteredAchievements;

      setAchievements(limitedAchievements);
      setMilestones(dynamicMilestones);
      setLoading(false);
    };

    loadAchievements();
  }, [category, maxItems, userBadges, badges]);

  // Função para obter cor baseada na raridade
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 border-gray-200';
      case 'rare': return 'text-blue-600 border-blue-200';
      case 'epic': return 'text-purple-600 border-purple-200';
      case 'legendary': return 'text-yellow-600 border-yellow-200';
      default: return 'text-gray-600 border-gray-200';
    }
  };

  // Função para obter ícone da categoria
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'milestone': return <Trophy className="h-4 w-4" />;
      case 'streak': return <Flame className="h-4 w-4" />;
      case 'speed': return <Zap className="h-4 w-4" />;
      case 'community': return <Users className="h-4 w-4" />;
      case 'special': return <Crown className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  // Renderizar conquista individual
  const renderAchievement = (achievement: Achievement) => {
    const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;
    
    return (
      <Card 
        key={achievement.id} 
        className={`cursor-pointer transition-all hover:shadow-md ${
          achievement.isUnlocked ? 'bg-green-50 border-green-200' : 'bg-gray-50'
        }`}
        onClick={() => setSelectedAchievement(achievement)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              achievement.isUnlocked 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              {achievement.isUnlocked ? <CheckCircle className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-semibold text-sm ${
                  achievement.isUnlocked ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {achievement.title}
                </h3>
                <Badge variant="outline" className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                  {achievement.rarity}
                </Badge>
              </div>
              
              <p className={`text-xs mb-2 ${
                achievement.isUnlocked ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {achievement.description}
              </p>
              
              {showProgress && !achievement.isUnlocked && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">
                      {achievement.progress}/{achievement.maxProgress}
                    </span>
                    <span className="text-gray-500">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-1" />
                </div>
              )}
              
              {showRewards && (
                <div className="flex items-center gap-2 mt-2">
                  <Gift className="h-3 w-3 text-yellow-600" />
                  <span className="text-xs text-yellow-600 font-medium">
                    +{achievement.reward.points} pontos
                  </span>
                  {achievement.reward.title && (
                    <Badge variant="outline" className="text-xs">
                      {achievement.reward.title}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderizar marco individual
  const renderMilestone = (milestone: Milestone) => {
    const progressPercentage = (milestone.currentValue / milestone.targetValue) * 100;
    
    return (
      <Card key={milestone.id} className={milestone.isCompleted ? 'bg-green-50 border-green-200' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              milestone.isCompleted 
                ? 'bg-green-100 text-green-600' 
                : 'bg-blue-100 text-blue-600'
            }`}>
              {milestone.icon}
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">{milestone.title}</h3>
              <p className="text-xs text-gray-600 mb-2">{milestone.description}</p>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">
                    {milestone.currentValue}/{milestone.targetValue}
                  </span>
                  <span className="text-gray-500">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
              
              {showRewards && (
                <div className="flex items-center gap-2 mt-2">
                  <Gift className="h-3 w-3 text-yellow-600" />
                  <span className="text-xs text-yellow-600 font-medium">
                    +{milestone.reward.points} pontos
                  </span>
                  {milestone.reward.title && (
                    <Badge variant="outline" className="text-xs">
                      {milestone.reward.title}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-2 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Versão minimal
  if (variant === 'minimal') {
    const recentAchievements = achievements.filter(a => a.isUnlocked).slice(0, 3);
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Conquistas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentAchievements.map(achievement => (
            <div key={achievement.id} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">{achievement.title}</span>
              <Badge variant="outline" className={`text-xs ml-auto ${getRarityColor(achievement.rarity)}`}>
                {achievement.rarity}
              </Badge>
            </div>
          ))}
          
          {recentAchievements.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhuma conquista ainda. Continue estudando!
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Versão compact
  if (variant === 'compact') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            Conquistas
          </h2>
          <Badge variant="outline">
            {achievements.filter(a => a.isUnlocked).length}/{achievements.length}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {achievements.slice(0, 5).map(renderAchievement)}
        </div>
      </div>
    );
  }

  // Versão full
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-7 w-7 text-yellow-600" />
          Conquistas e Marcos
        </h1>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {achievements.filter(a => a.isUnlocked).length} conquistadas
          </Badge>
          <Badge variant="outline">
            {milestones.filter(m => m.isCompleted).length} marcos
          </Badge>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          <TabsTrigger value="milestones">Marcos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map(renderAchievement)}
          </div>
        </TabsContent>
        
        <TabsContent value="milestones" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {milestones.map(renderMilestone)}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Modal de detalhes da conquista */}
      <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAchievement?.icon}
              {selectedAchievement?.title}
              <Badge variant="outline" className={getRarityColor(selectedAchievement?.rarity || 'common')}>
                {selectedAchievement?.rarity}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {selectedAchievement?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAchievement && (
            <div className="space-y-4">
              {/* Progresso */}
              {!selectedAchievement.isUnlocked && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>
                      {selectedAchievement.progress}/{selectedAchievement.maxProgress}
                    </span>
                  </div>
                  <Progress 
                    value={(selectedAchievement.progress / selectedAchievement.maxProgress) * 100} 
                    className="h-2" 
                  />
                </div>
              )}
              
              {/* Requisitos */}
              <div>
                <h4 className="font-semibold mb-2">Requisitos:</h4>
                <ul className="space-y-1">
                  {selectedAchievement.requirements.map((req, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                      <Target className="h-3 w-3" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Recompensas */}
              <div>
                <h4 className="font-semibold mb-2">Recompensas:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">{selectedAchievement.reward.points} pontos</span>
                  </div>
                  {selectedAchievement.reward.title && (
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Título: {selectedAchievement.reward.title}</span>
                    </div>
                  )}
                  {selectedAchievement.reward.badges && (
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{selectedAchievement.reward.badges.length} badge(s)</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Data de conquista */}
              {selectedAchievement.isUnlocked && selectedAchievement.unlockedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  Conquistado em {selectedAchievement.unlockedAt.toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}