import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star, 
  Target, 
  Clock, 
  TrendingUp, 
  Users, 
  Award, 
  Zap,
  Calendar,
  Filter,
  ChevronUp,
  ChevronDown,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

// Interface para entrada do leaderboard
interface LeaderboardEntry {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    level: number;
    title?: string;
  };
  position: number;
  previousPosition?: number;
  score: number;
  completedChallenges: number;
  averageTime: number; // em minutos
  streak: number;
  badges: number;
  lastActivity: string;
  isCurrentUser?: boolean;
}

// Interface para estatísticas do leaderboard
interface LeaderboardStats {
  totalParticipants: number;
  averageScore: number;
  topScore: number;
  completionRate: number;
}

// Interface para props do componente
interface ChallengeLeaderboardProps {
  challengeId?: string;
  variant?: 'full' | 'compact' | 'minimal';
  period?: 'daily' | 'weekly' | 'monthly' | 'all-time';
  metric?: 'score' | 'speed' | 'completion' | 'streak';
  maxEntries?: number;
  showStats?: boolean;
  showCurrentUser?: boolean;
}

// Componente para entrada individual do leaderboard
function LeaderboardEntryItem({ 
  entry, 
  metric, 
  showChange = true 
}: { 
  entry: LeaderboardEntry;
  metric: string;
  showChange?: boolean;
}) {
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Trophy className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-sm font-bold text-muted-foreground">#{position}</span>;
    }
  };
  
  const getPositionChange = () => {
    if (!entry.previousPosition || !showChange) return null;
    
    const change = entry.previousPosition - entry.position;
    if (change > 0) {
      return (
        <div className="flex items-center text-green-600">
          <ChevronUp className="h-3 w-3" />
          <span className="text-xs">+{change}</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-600">
          <ChevronDown className="h-3 w-3" />
          <span className="text-xs">{change}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-muted-foreground">
          <Minus className="h-3 w-3" />
          <span className="text-xs">0</span>
        </div>
      );
    }
  };
  
  const getMetricValue = () => {
    switch (metric) {
      case 'score': return `${entry.score.toLocaleString()} pts`;
      case 'speed': return `${entry.averageTime}min`;
      case 'completion': return `${entry.completedChallenges} desafios`;
      case 'streak': return `${entry.streak} dias`;
      default: return `${entry.score.toLocaleString()} pts`;
    }
  };
  
  const getMetricIcon = () => {
    switch (metric) {
      case 'score': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'speed': return <Zap className="h-4 w-4 text-blue-500" />;
      case 'completion': return <Target className="h-4 w-4 text-green-500" />;
      case 'streak': return <Award className="h-4 w-4 text-purple-500" />;
      default: return <Star className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
      entry.isCurrentUser ? 'bg-blue-50 border-blue-200' : 'bg-white'
    }`}>
      {/* Posição */}
      <div className="flex items-center gap-2 min-w-[60px]">
        {getPositionIcon(entry.position)}
        {getPositionChange()}
      </div>
      
      {/* Usuário */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={entry.user.avatar} alt={entry.user.name} />
          <AvatarFallback>
            {entry.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium truncate ${
              entry.isCurrentUser ? 'text-blue-700' : 'text-foreground'
            }`}>
              {entry.user.name}
              {entry.isCurrentUser && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Você
                </Badge>
              )}
            </h4>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Nível {entry.user.level}</span>
            {entry.user.title && (
              <Badge variant="outline" className="text-xs">
                {entry.user.title}
              </Badge>
            )}
            <span>•</span>
            <span>{entry.badges} badges</span>
          </div>
        </div>
      </div>
      
      {/* Métrica */}
      <div className="flex items-center gap-2 text-right">
        {getMetricIcon()}
        <div>
          <p className="font-semibold">{getMetricValue()}</p>
          <p className="text-xs text-muted-foreground">
            Ativo {formatDistanceToNow(new Date(entry.lastActivity), { 
              addSuffix: true, 
              locale: ptBR 
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente para estatísticas do leaderboard
function LeaderboardStatsCard({ stats }: { stats: LeaderboardStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
          <p className="text-2xl font-bold">{stats.totalParticipants.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Participantes</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
          <p className="text-2xl font-bold">{stats.averageScore.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Pontuação Média</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-amber-600" />
          <p className="text-2xl font-bold">{stats.topScore.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Maior Pontuação</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p className="text-2xl font-bold">{stats.completionRate}%</p>
          <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente principal
export default function ChallengeLeaderboard({ 
  challengeId,
  variant = 'full',
  period = 'weekly',
  metric = 'score',
  maxEntries = 50,
  showStats = true,
  showCurrentUser = true
}: ChallengeLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState(period);
  const [currentMetric, setCurrentMetric] = useState(metric);
  
  // Simular dados do leaderboard
  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      
      // Buscar dados reais do Supabase
      const { data: userBadges, error } = await supabase
        .from('user_badges')
        .select(`
          user_id,
          profiles!inner(id, name, email, avatar_url)
        `);

      if (error) {
        console.error('Erro ao carregar leaderboard:', error);
        setEntries([]);
        setStats({ totalParticipants: 0, averageScore: 0, topScore: 0, completionRate: 0 });
        return;
      }

      // Processar dados para criar leaderboard
      const userStats = new Map<string, {
        id: string;
        name: string;
        avatar: string;
        badgeCount: number;
        score: number;
      }>();

      userBadges?.forEach((userBadge: any) => {
        const userId = userBadge.user_id;
        const user = userBadge.profiles;

        if (!userStats.has(userId)) {
          userStats.set(userId, {
            id: userId,
            name: user.name || 'Usuário',
            avatar: user.avatar_url || '',
            badgeCount: 0,
            score: 0
          });
        }

        const stats = userStats.get(userId)!;
        stats.badgeCount += 1;
        stats.score += 100; // 100 pontos por badge
      });

      // Converter para array de leaderboard e ordenar
      const leaderboardEntries = Array.from(userStats.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, maxEntries)
        .map((user, index) => ({
          id: user.id,
          user: {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            level: Math.floor(user.score / 300) + 1,
            title: user.score > 1000 ? 'Expert' : user.score > 500 ? 'Avançado' : 'Iniciante'
          },
          position: index + 1,
          previousPosition: index + 1,
          score: user.score,
          completedChallenges: user.badgeCount,
          averageTime: Math.floor(Math.random() * 40) + 15, // Placeholder
          streak: Math.floor(Math.random() * 10), // Placeholder
          badges: user.badgeCount,
          lastActivity: new Date().toISOString(),
          isCurrentUser: false // TODO: implementar detecção do usuário atual
        }));

      const realStats: LeaderboardStats = {
        totalParticipants: leaderboardEntries.length,
        averageScore: leaderboardEntries.length > 0 ? 
          Math.floor(leaderboardEntries.reduce((sum, entry) => sum + entry.score, 0) / leaderboardEntries.length) : 0,
        topScore: leaderboardEntries.length > 0 ? Math.max(...leaderboardEntries.map(entry => entry.score)) : 0,
        completionRate: Math.floor(Math.random() * 50) + 30 // Placeholder
      };
      
      setEntries(leaderboardEntries);
      setStats(realStats);
      setLoading(false);
    };
    
    loadLeaderboard();
  }, [challengeId, currentPeriod, currentMetric, maxEntries]);
  
  // Encontrar posição do usuário atual
  const currentUserEntry = entries.find(entry => entry.isCurrentUser);
  
  // Variant minimal
  if (variant === 'minimal') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {entries.slice(0, 5).map(entry => (
                <div key={entry.id} className="flex items-center gap-3 text-sm">
                  <div className="w-6 text-center">
                    {entry.position <= 3 ? (
                      entry.position === 1 ? <Crown className="h-4 w-4 text-yellow-500" /> :
                      entry.position === 2 ? <Medal className="h-4 w-4 text-gray-400" /> :
                      <Trophy className="h-4 w-4 text-amber-600" />
                    ) : (
                      <span className="text-xs font-medium">#{entry.position}</span>
                    )}
                  </div>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={entry.user.avatar} alt={entry.user.name} />
                    <AvatarFallback className="text-xs">
                      {entry.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{entry.user.name}</p>
                    <p className="text-xs text-muted-foreground">Nível {entry.user.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{entry.score.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Variant compact
  if (variant === 'compact') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Leaderboard</CardTitle>
            <div className="flex gap-2">
              <Select value={currentPeriod} onValueChange={setCurrentPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Hoje</SelectItem>
                  <SelectItem value="weekly">Semana</SelectItem>
                  <SelectItem value="monthly">Mês</SelectItem>
                  <SelectItem value="all-time">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {entries.slice(0, 15).map(entry => (
                <LeaderboardEntryItem
                  key={entry.id}
                  entry={entry}
                  metric={currentMetric}
                  showChange={false}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Variant full (default)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Leaderboard de Desafios</h2>
          <p className="text-muted-foreground">
            Rankings e estatísticas da comunidade
          </p>
        </div>
      </div>
      
      {/* Estatísticas */}
      {showStats && stats && !loading && (
        <LeaderboardStatsCard stats={stats} />
      )}
      
      {/* Filtros e Tabs */}
      <Card>
        <CardContent className="p-4">
          <Tabs value={currentMetric} onValueChange={setCurrentMetric}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="score">Pontuação</TabsTrigger>
                <TabsTrigger value="speed">Velocidade</TabsTrigger>
                <TabsTrigger value="completion">Conclusões</TabsTrigger>
                <TabsTrigger value="streak">Sequência</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={currentPeriod} onValueChange={setCurrentPeriod}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Hoje</SelectItem>
                    <SelectItem value="weekly">Esta Semana</SelectItem>
                    <SelectItem value="monthly">Este Mês</SelectItem>
                    <SelectItem value="all-time">Todos os Tempos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <TabsContent value={currentMetric} className="mt-0">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-24" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.map(entry => (
                    <LeaderboardEntryItem
                      key={entry.id}
                      entry={entry}
                      metric={currentMetric}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Posição do usuário atual */}
      {showCurrentUser && currentUserEntry && !loading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-blue-700">Sua Posição</CardTitle>
          </CardHeader>
          <CardContent>
            <LeaderboardEntryItem
              entry={currentUserEntry}
              metric={currentMetric}
            />
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-700">#{currentUserEntry.position}</p>
                <p className="text-xs text-blue-600">Posição Atual</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-700">{currentUserEntry.score.toLocaleString()}</p>
                <p className="text-xs text-blue-600">Pontos</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-700">{currentUserEntry.completedChallenges}</p>
                <p className="text-xs text-blue-600">Desafios</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-700">{currentUserEntry.streak}</p>
                <p className="text-xs text-blue-600">Sequência</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}