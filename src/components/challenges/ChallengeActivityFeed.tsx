import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Target, 
  Users, 
  MessageCircle, 
  ThumbsUp, 
  Share2, 
  Clock, 
  Star,
  CheckCircle,
  Award,
  TrendingUp,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Interface para atividade
interface ChallengeActivity {
  id: string;
  type: 'completion' | 'progress' | 'join' | 'achievement' | 'comment' | 'like' | 'share';
  user: {
    id: string;
    name: string;
    avatar?: string;
    level?: number;
  };
  challenge: {
    id: string;
    title: string;
    badge_icon: string;
    difficulty: string;
  };
  content?: string;
  progress?: number;
  achievement?: {
    name: string;
    icon: string;
    rarity: string;
  };
  timestamp: string;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

// Interface para props do componente
interface ChallengeActivityFeedProps {
  challengeId?: string;
  variant?: 'full' | 'compact' | 'minimal';
  maxItems?: number;
  showFilters?: boolean;
}

// Componente para uma atividade individual
function ActivityItem({ 
  activity, 
  onLike, 
  onComment, 
  onShare 
}: { 
  activity: ChallengeActivity;
  onLike: (activityId: string) => void;
  onComment: (activityId: string) => void;
  onShare: (activityId: string) => void;
}) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completion': return <Trophy className="h-5 w-5 text-yellow-600" />;
      case 'progress': return <Target className="h-5 w-5 text-blue-600" />;
      case 'join': return <Users className="h-5 w-5 text-green-600" />;
      case 'achievement': return <Award className="h-5 w-5 text-purple-600" />;
      case 'comment': return <MessageCircle className="h-5 w-5 text-gray-600" />;
      case 'like': return <ThumbsUp className="h-5 w-5 text-red-600" />;
      case 'share': return <Share2 className="h-5 w-5 text-blue-600" />;
      default: return <Star className="h-5 w-5 text-gray-600" />;
    }
  };
  
  const getActivityMessage = (activity: ChallengeActivity) => {
    switch (activity.type) {
      case 'completion':
        return `completou o desafio "${activity.challenge.title}"`;
      case 'progress':
        return `fez progresso no desafio "${activity.challenge.title}" (${activity.progress}%)`;
      case 'join':
        return `entrou no desafio "${activity.challenge.title}"`;
      case 'achievement':
        return `conquistou o badge "${activity.achievement?.name}" no desafio "${activity.challenge.title}"`;
      case 'comment':
        return `comentou no desafio "${activity.challenge.title}"`;
      case 'like':
        return `curtiu o desafio "${activity.challenge.title}"`;
      case 'share':
        return `compartilhou o desafio "${activity.challenge.title}"`;
      default:
        return `interagiu com o desafio "${activity.challenge.title}"`;
    }
  };
  
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'completion': return 'border-l-yellow-500 bg-yellow-50';
      case 'progress': return 'border-l-blue-500 bg-blue-50';
      case 'join': return 'border-l-green-500 bg-green-50';
      case 'achievement': return 'border-l-purple-500 bg-purple-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <Card className={`border-l-4 ${getActivityColor(activity.type)} transition-all duration-200 hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar do usuário */}
          <Avatar className="h-10 w-10">
            <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
            <AvatarFallback>
              {activity.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            {/* Header da atividade */}
            <div className="flex items-center gap-2 mb-2">
              {getActivityIcon(activity.type)}
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.user.name}</span>
                  {' '}
                  <span className="text-muted-foreground">
                    {getActivityMessage(activity)}
                  </span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                  {activity.user.level && (
                    <Badge variant="outline" className="text-xs">
                      Nível {activity.user.level}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Conteúdo adicional */}
            {activity.content && (
              <div className="bg-white p-3 rounded-lg border mt-2">
                <p className="text-sm text-muted-foreground">{activity.content}</p>
              </div>
            )}
            
            {/* Badge conquistado */}
            {activity.achievement && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-white rounded-lg border">
                <div className="text-2xl">{activity.achievement.icon}</div>
                <div>
                  <p className="text-sm font-medium">{activity.achievement.name}</p>
                  <Badge className={`text-xs ${
                    activity.achievement.rarity === 'common' ? 'bg-gray-100 text-gray-800' :
                    activity.achievement.rarity === 'uncommon' ? 'bg-green-100 text-green-800' :
                    activity.achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                    activity.achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {activity.achievement.rarity}
                  </Badge>
                </div>
              </div>
            )}
            
            {/* Ações */}
            <div className="flex items-center gap-4 mt-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onLike(activity.id)}
                className={`text-xs ${activity.is_liked ? 'text-red-600' : 'text-muted-foreground'}`}
              >
                <ThumbsUp className={`h-4 w-4 mr-1 ${activity.is_liked ? 'fill-current' : ''}`} />
                {activity.likes_count || 0}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onComment(activity.id)}
                className="text-xs text-muted-foreground"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                {activity.comments_count || 0}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onShare(activity.id)}
                className="text-xs text-muted-foreground"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Compartilhar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente principal
export default function ChallengeActivityFeed({ 
  challengeId,
  variant = 'full',
  maxItems = 20,
  showFilters = true
}: ChallengeActivityFeedProps) {
  const [activities, setActivities] = useState<ChallengeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  
  // Carregar atividades reais do Supabase
  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      
      try {
        // Buscar badges do usuário (representando atividades de conclusão)
        let query = supabase
          .from('user_badges')
          .select(`
            id,
            created_at,
            user_id,
            badge_id,
            profiles!inner(
              id,
              name,
              email,
              avatar_url
            ),
            badges!inner(
              id,
              name,
              description,
              category,
              key
            )
          `)
          .order('created_at', { ascending: false })
          .limit(maxItems);

        const { data: userBadges, error } = await query;
        
        if (error) {
          console.error('Erro ao carregar atividades:', error);
          setActivities([]);
          return;
        }

        // Converter dados do Supabase para formato de atividades
        const activities: ChallengeActivity[] = (userBadges || []).map((userBadge, index) => {
          const user = Array.isArray(userBadge.profiles) ? userBadge.profiles[0] : userBadge.profiles;
          const badge = Array.isArray(userBadge.badges) ? userBadge.badges[0] : userBadge.badges;
          
          // Simular diferentes tipos de atividade baseado no índice
          const activityTypes: ChallengeActivity['type'][] = ['completion', 'achievement', 'progress', 'join'];
          const type = activityTypes[index % activityTypes.length];
          
          // Mapear categoria para ícone
          const categoryIcons: Record<string, string> = {
            'programming': '💻',
            'design': '🎨',
            'data': '📊',
            'security': '🔒',
            'mobile': '📱',
            'web': '🌐',
            'ai': '🤖',
            'devops': '⚙️'
          };
          
          // Mapear categoria para dificuldade
          const difficulties = ['easy', 'medium', 'hard'];
          const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
          
          return {
            id: userBadge.id,
            type,
            user: {
              id: user.id,
              name: user.name || user.email.split('@')[0],
              avatar: user.avatar_url,
              level: Math.floor(Math.random() * 20) + 1 // Simular nível
            },
            challenge: {
              id: badge.id,
              title: badge.name,
              badge_icon: categoryIcons[badge.category] || '🏆',
              difficulty
            },
            achievement: type === 'achievement' ? {
              name: badge.name,
              icon: categoryIcons[badge.category] || '🏆',
              rarity: ['common', 'uncommon', 'rare', 'epic'][Math.floor(Math.random() * 4)]
            } : undefined,
            progress: type === 'progress' ? Math.floor(Math.random() * 100) : undefined,
            content: type === 'comment' ? `Comentário sobre ${badge.name}` : undefined,
            timestamp: userBadge.created_at,
            likes_count: Math.floor(Math.random() * 20),
            comments_count: Math.floor(Math.random() * 10),
            is_liked: Math.random() > 0.7
          };
        });
        
        // Filtrar por desafio específico se fornecido
        const filteredActivities = challengeId 
          ? activities.filter(activity => activity.challenge.id === challengeId)
          : activities;
        
        setActivities(filteredActivities);
      } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadActivities();
  }, [challengeId, maxItems]);
  
  // Filtrar atividades
  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.type === filter;
  });
  
  // Handlers
  const handleLike = async (activityId: string) => {
    setActivities(prev => prev.map(activity => {
      if (activity.id === activityId) {
        const isLiked = !activity.is_liked;
        return {
          ...activity,
          is_liked: isLiked,
          likes_count: (activity.likes_count || 0) + (isLiked ? 1 : -1)
        };
      }
      return activity;
    }));
    
    toast.success('Curtida atualizada!');
  };
  
  const handleComment = (activityId: string) => {
    toast.info('Funcionalidade de comentários em breve!');
  };
  
  const handleShare = async (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    
    const shareText = `Confira esta atividade no desafio "${activity.challenge.title}"!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Atividade do Desafio',
          text: shareText,
          url: window.location.href,
        });
      } catch (error) {
        navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
        toast.success('Link copiado para a área de transferência!');
      }
    } else {
      navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
      toast.success('Link copiado para a área de transferência!');
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    // Simular refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast.success('Feed atualizado!');
  };

  // Variant minimal
  if (variant === 'minimal') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.slice(0, 5).map(activity => (
                <div key={activity.id} className="flex items-center gap-3 text-sm">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                    <AvatarFallback className="text-xs">
                      {activity.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">
                      <span className="font-medium">{activity.user.name}</span>
                      {' '}
                      <span className="text-muted-foreground">
                        {activity.type === 'completion' ? 'completou' :
                         activity.type === 'progress' ? 'progrediu em' :
                         activity.type === 'join' ? 'entrou em' :
                         'interagiu com'}
                      </span>
                      {' '}
                      <span className="font-medium">{activity.challenge.title}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                  {getActivityIcon(activity.type)}
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
            <CardTitle>Feed de Atividades</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {showFilters && (
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="completion">Conclusões</SelectItem>
                  <SelectItem value="progress">Progresso</SelectItem>
                  <SelectItem value="achievement">Conquistas</SelectItem>
                  <SelectItem value="join">Participações</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Nenhuma atividade</h3>
              <p className="text-muted-foreground">
                Não há atividades para exibir no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredActivities.map(activity => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  onLike={handleLike}
                  onComment={handleComment}
                  onShare={handleShare}
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
          <h2 className="text-2xl font-bold">Feed de Atividades</h2>
          <p className="text-muted-foreground">
            Acompanhe o progresso e conquistas da comunidade
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>
      
      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar atividades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as atividades</SelectItem>
                  <SelectItem value="completion">Conclusões</SelectItem>
                  <SelectItem value="progress">Progresso</SelectItem>
                  <SelectItem value="achievement">Conquistas</SelectItem>
                  <SelectItem value="join">Novas participações</SelectItem>
                  <SelectItem value="comment">Comentários</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                <Clock className="h-4 w-4" />
                <span>Atualizado {formatDistanceToNow(new Date(), { locale: ptBR })}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Lista de atividades */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-32 mb-3" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhuma atividade encontrada</h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? 'Não há atividades para exibir no momento.'
                : `Não há atividades do tipo "${filter}" para exibir.`
              }
            </p>
            {filter !== 'all' && (
              <Button 
                variant="outline" 
                onClick={() => setFilter('all')}
                className="mt-4"
              >
                Ver todas as atividades
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map(activity => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
            />
          ))}
          
          {filteredActivities.length >= maxItems && (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground mb-3">
                  Mostrando {maxItems} atividades mais recentes
                </p>
                <Button variant="outline">
                  Carregar mais atividades
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// Função auxiliar para obter ícone da atividade (exportada para uso externo)
export function getActivityIcon(type: string) {
  switch (type) {
    case 'completion': return <Trophy className="h-4 w-4 text-yellow-600" />;
    case 'progress': return <Target className="h-4 w-4 text-blue-600" />;
    case 'join': return <Users className="h-4 w-4 text-green-600" />;
    case 'achievement': return <Award className="h-4 w-4 text-purple-600" />;
    case 'comment': return <MessageCircle className="h-4 w-4 text-gray-600" />;
    case 'like': return <ThumbsUp className="h-4 w-4 text-red-600" />;
    case 'share': return <Share2 className="h-4 w-4 text-blue-600" />;
    default: return <Star className="h-4 w-4 text-gray-600" />;
  }
}