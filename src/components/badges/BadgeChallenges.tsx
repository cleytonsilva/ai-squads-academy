import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Target, 
  Trophy, 
  Clock, 
  Users, 
  Star,
  CheckCircle,
  Lock,
  Calendar,
  Award,
  Zap,
  Flag,
  Timer,
  Gift,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

// Interface para desafio de badge
interface BadgeChallenge {
  id: string;
  title: string;
  description: string;
  badge_id: string;
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
  time_limit?: string; // ISO date string
  participants_count: number;
  completion_rate: number;
  is_active: boolean;
  is_completed: boolean;
  is_locked: boolean;
  unlock_requirements?: string;
  started_at?: string;
  completed_at?: string;
}

// Interface para props do componente
interface BadgeChallengesProps {
  userId?: string;
  category?: string;
  difficulty?: string;
  showCompleted?: boolean;
  limit?: number;
}

/**
 * Componente para exibir desafios de badges
 */
export default function BadgeChallenges({ 
  userId,
  category,
  difficulty,
  showCompleted = true,
  limit
}: BadgeChallengesProps) {
  const [challenges, setChallenges] = useState<BadgeChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedChallenge, setSelectedChallenge] = useState<BadgeChallenge | null>(null);

  // Carregar desafios
  useEffect(() => {
    loadChallenges();
  }, [category, difficulty, userId]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      
      // Buscar badges reais do Supabase para criar desafios baseados neles
      const { data: badges, error } = await supabase
        .from('badges')
        .select('*');

      if (error) {
        console.error('Erro ao carregar badges:', error);
        setChallenges([]);
        return;
      }

      // Criar desafios baseados nos badges disponíveis
      const challengesFromBadges: BadgeChallenge[] = badges?.map((badge, index) => ({
        id: badge.id,
        title: `Conquiste o ${badge.name}`,
        description: badge.description || `Complete os requisitos para conquistar o badge ${badge.name}`,
        badge_id: badge.id,
        badge_name: badge.name,
        badge_rarity: badge.category || 'common',
        requirements: [
          {
            type: 'course_completion',
            target: 1,
            current: 0,
            description: 'Requisitos concluídos'
          }
        ],
        reward_points: 100,
        difficulty: badge.category === 'legendary' ? 'expert' : 
                   badge.category === 'epic' ? 'hard' : 
                   badge.category === 'rare' ? 'medium' : 'easy',
        category: badge.category || 'Geral',
        participants_count: Math.floor(Math.random() * 200) + 50,
        completion_rate: Math.floor(Math.random() * 50) + 10,
        is_active: true,
        is_completed: false,
        is_locked: false,
        started_at: new Date().toISOString()
      })) || [];

      // Filtrar por categoria e dificuldade se especificado
      let filteredChallenges = challengesFromBadges;
      
      if (category && category !== 'all') {
        filteredChallenges = filteredChallenges.filter(c => 
          c.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      if (difficulty && difficulty !== 'all') {
        filteredChallenges = filteredChallenges.filter(c => c.difficulty === difficulty);
      }
      
      if (!showCompleted) {
        filteredChallenges = filteredChallenges.filter(c => !c.is_completed);
      }
      
      if (limit) {
        filteredChallenges = filteredChallenges.slice(0, limit);
      }

      setChallenges(filteredChallenges);
    } catch (error) {
      console.error('Erro ao carregar desafios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obter configuração da raridade
  const getRarityConfig = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return { color: 'text-gray-600 bg-gray-100 border-gray-200', icon: Star };
      case 'uncommon':
        return { color: 'text-green-600 bg-green-100 border-green-200', icon: Star };
      case 'rare':
        return { color: 'text-blue-600 bg-blue-100 border-blue-200', icon: Award };
      case 'epic':
        return { color: 'text-purple-600 bg-purple-100 border-purple-200', icon: Trophy };
      case 'legendary':
        return { color: 'text-yellow-600 bg-yellow-100 border-yellow-200', icon: Crown };
      default:
        return { color: 'text-gray-600 bg-gray-100 border-gray-200', icon: Star };
    }
  };

  // Obter configuração da dificuldade
  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { color: 'bg-green-100 text-green-800', label: 'Fácil' };
      case 'medium':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Médio' };
      case 'hard':
        return { color: 'bg-orange-100 text-orange-800', label: 'Difícil' };
      case 'expert':
        return { color: 'bg-red-100 text-red-800', label: 'Expert' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: 'Desconhecido' };
    }
  };

  // Calcular progresso total do desafio
  const calculateProgress = (challenge: BadgeChallenge) => {
    if (challenge.is_completed) return 100;
    
    const totalProgress = challenge.requirements.reduce((sum, req) => {
      const progress = Math.min((req.current / req.target) * 100, 100);
      return sum + progress;
    }, 0);
    
    return Math.round(totalProgress / challenge.requirements.length);
  };

  // Participar do desafio
  const joinChallenge = async (challengeId: string) => {
    try {
      // Implementar lógica para participar do desafio
      console.log('Participar do desafio:', challengeId);
    } catch (error) {
      console.error('Erro ao participar do desafio:', error);
    }
  };

  // Renderizar card do desafio
  const renderChallengeCard = (challenge: BadgeChallenge) => {
    const rarityConfig = getRarityConfig(challenge.badge_rarity);
    const difficultyConfig = getDifficultyConfig(challenge.difficulty);
    const progress = calculateProgress(challenge);
    const timeLeft = challenge.time_limit ? new Date(challenge.time_limit).getTime() - Date.now() : null;
    const daysLeft = timeLeft ? Math.ceil(timeLeft / (1000 * 60 * 60 * 24)) : null;

    return (
      <motion.div
        key={challenge.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cn(
          'transition-all duration-200 hover:shadow-lg cursor-pointer',
          challenge.is_locked && 'opacity-60',
          challenge.is_completed && 'border-green-200 bg-green-50/50'
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                  {challenge.is_locked && <Lock className="w-4 h-4 text-muted-foreground" />}
                  {challenge.is_completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {challenge.description}
                </p>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className={difficultyConfig.color}>
                    {difficultyConfig.label}
                  </Badge>
                  
                  <Badge variant="outline">
                    {challenge.category}
                  </Badge>
                  
                  <Badge variant="secondary" className={rarityConfig.color}>
                    {challenge.badge_name}
                  </Badge>
                  
                  {daysLeft && daysLeft > 0 && (
                    <Badge variant="outline" className="text-orange-600">
                      <Timer className="w-3 h-3 mr-1" />
                      {daysLeft}d restantes
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {challenge.reward_points}
                </div>
                <div className="text-xs text-muted-foreground">pontos</div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* Progresso */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progresso Geral</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            {/* Requisitos */}
            <div className="space-y-2 mb-4">
              {challenge.requirements.map((req, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{req.description}</span>
                  <span className={cn(
                    'font-medium',
                    req.current >= req.target ? 'text-green-600' : 'text-muted-foreground'
                  )}>
                    {req.current}/{req.target}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Estatísticas */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {challenge.participants_count} participantes
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {challenge.completion_rate}% concluído
              </span>
            </div>
            
            {/* Ações */}
            <div className="flex gap-2">
              {challenge.is_locked ? (
                <Button variant="outline" disabled className="flex-1">
                  <Lock className="w-4 h-4 mr-2" />
                  Bloqueado
                </Button>
              ) : challenge.is_completed ? (
                <Button variant="outline" disabled className="flex-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Concluído
                </Button>
              ) : (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        Ver Detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{challenge.title}</DialogTitle>
                      </DialogHeader>
                      <ChallengeDetails challenge={challenge} />
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    onClick={() => joinChallenge(challenge.id)}
                    className="flex-1"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Participar
                  </Button>
                </>
              )}
            </div>
            
            {challenge.is_locked && challenge.unlock_requirements && (
              <p className="text-xs text-muted-foreground mt-2">
                Para desbloquear: {challenge.unlock_requirements}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-2 w-full mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const activeChallenges = challenges.filter(c => c.is_active && !c.is_completed);
  const completedChallenges = challenges.filter(c => c.is_completed);
  const lockedChallenges = challenges.filter(c => c.is_locked);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Ativos ({activeChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Concluídos ({completedChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="locked" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Bloqueados ({lockedChallenges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          <AnimatePresence>
            {activeChallenges.map(challenge => renderChallengeCard(challenge))}
          </AnimatePresence>
          
          {activeChallenges.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum desafio ativo</h3>
                <p className="text-muted-foreground">
                  Não há desafios ativos no momento. Volte em breve!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          <AnimatePresence>
            {completedChallenges.map(challenge => renderChallengeCard(challenge))}
          </AnimatePresence>
          
          {completedChallenges.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum desafio concluído</h3>
                <p className="text-muted-foreground">
                  Complete desafios para conquistar badges especiais!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="locked" className="space-y-4 mt-6">
          <AnimatePresence>
            {lockedChallenges.map(challenge => renderChallengeCard(challenge))}
          </AnimatePresence>
          
          {lockedChallenges.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Todos os desafios desbloqueados!</h3>
                <p className="text-muted-foreground">
                  Parabéns! Você desbloqueou todos os desafios disponíveis.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Componente para exibir detalhes do desafio
 */
function ChallengeDetails({ challenge }: { challenge: BadgeChallenge }) {
  const rarityConfig = getRarityConfig(challenge.badge_rarity);
  const difficultyConfig = getDifficultyConfig(challenge.difficulty);
  const progress = calculateProgress(challenge);
  
  return (
    <div className="space-y-6">
      {/* Informações do badge */}
      <div className="text-center">
        <div className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3',
          rarityConfig.color
        )}>
          {challenge.badge_icon ? (
            <img 
              src={challenge.badge_icon} 
              alt={challenge.badge_name}
              className="w-8 h-8 object-contain"
            />
          ) : (
            <rarityConfig.icon className="w-8 h-8" />
          )}
        </div>
        
        <h3 className="text-xl font-bold">{challenge.badge_name}</h3>
        <p className="text-muted-foreground">{challenge.description}</p>
        
        <div className="flex items-center justify-center gap-2 mt-3">
          <Badge variant="secondary" className={difficultyConfig.color}>
            {difficultyConfig.label}
          </Badge>
          <Badge variant="outline">{challenge.category}</Badge>
          <Badge variant="secondary" className={rarityConfig.color}>
            {challenge.badge_rarity}
          </Badge>
        </div>
      </div>
      
      {/* Progresso detalhado */}
      <div>
        <h4 className="font-semibold mb-3">Progresso dos Requisitos</h4>
        <div className="space-y-4">
          {challenge.requirements.map((req, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{req.description}</span>
                <span className="text-sm text-muted-foreground">
                  {req.current}/{req.target}
                </span>
              </div>
              <Progress 
                value={(req.current / req.target) * 100} 
                className="h-2" 
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {challenge.reward_points}
          </div>
          <div className="text-sm text-muted-foreground">Pontos de Recompensa</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {challenge.completion_rate}%
          </div>
          <div className="text-sm text-muted-foreground">Taxa de Conclusão</div>
        </div>
      </div>
      
      {/* Tempo limite */}
      {challenge.time_limit && (
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <Clock className="w-5 h-5 text-orange-600 mx-auto mb-2" />
          <div className="text-sm font-medium text-orange-800">
            Prazo: {new Date(challenge.time_limit).toLocaleDateString('pt-BR')}
          </div>
        </div>
      )}
    </div>
  );
}

// Funções auxiliares (duplicadas para evitar dependências)
function getRarityConfig(rarity: string) {
  switch (rarity) {
    case 'common':
      return { color: 'text-gray-600 bg-gray-100 border-gray-200', icon: Star };
    case 'uncommon':
      return { color: 'text-green-600 bg-green-100 border-green-200', icon: Star };
    case 'rare':
      return { color: 'text-blue-600 bg-blue-100 border-blue-200', icon: Award };
    case 'epic':
      return { color: 'text-purple-600 bg-purple-100 border-purple-200', icon: Trophy };
    case 'legendary':
      return { color: 'text-yellow-600 bg-yellow-100 border-yellow-200', icon: Crown };
    default:
      return { color: 'text-gray-600 bg-gray-100 border-gray-200', icon: Star };
  }
}

function getDifficultyConfig(difficulty: string) {
  switch (difficulty) {
    case 'easy':
      return { color: 'bg-green-100 text-green-800', label: 'Fácil' };
    case 'medium':
      return { color: 'bg-yellow-100 text-yellow-800', label: 'Médio' };
    case 'hard':
      return { color: 'bg-orange-100 text-orange-800', label: 'Difícil' };
    case 'expert':
      return { color: 'bg-red-100 text-red-800', label: 'Expert' };
    default:
      return { color: 'bg-gray-100 text-gray-800', label: 'Desconhecido' };
  }
}

function calculateProgress(challenge: BadgeChallenge) {
  if (challenge.is_completed) return 100;
  
  const totalProgress = challenge.requirements.reduce((sum, req) => {
    const progress = Math.min((req.current / req.target) * 100, 100);
    return sum + progress;
  }, 0);
  
  return Math.round(totalProgress / challenge.requirements.length);
}