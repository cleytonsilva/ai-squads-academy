import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Target, Trophy, Star, Calendar, Users, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useChallenges } from '@/hooks/useChallenges';
import { useToast } from "@/hooks/use-toast";

// Interface para props do componente
interface ChallengeProgressProps {
  challengeId?: string;
  variant?: 'full' | 'compact' | 'minimal';
  showActions?: boolean;
}

// Componente para exibir um requisito individual
function RequirementCard({ 
  requirement, 
  isCompleted 
}: { 
  requirement: any; 
  isCompleted: boolean; 
}) {
  const progress = requirement.target > 0 ? (requirement.current / requirement.target) * 100 : 0;
  
  const getRequirementIcon = (type: string) => {
    switch (type) {
      case 'course_completion': return '📚';
      case 'quiz_score': return '🎯';
      case 'streak': return '🔥';
      case 'time_spent': return '⏰';
      case 'projects': return '🚀';
      case 'community': return '👥';
      default: return '📋';
    }
  };
  
  const getRequirementLabel = (type: string) => {
    switch (type) {
      case 'course_completion': return 'Cursos Concluídos';
      case 'quiz_score': return 'Pontuação em Quiz';
      case 'streak': return 'Sequência de Dias';
      case 'time_spent': return 'Tempo de Estudo';
      case 'projects': return 'Projetos';
      case 'community': return 'Participação';
      default: return 'Requisito';
    }
  };

  return (
    <Card className={`transition-all duration-200 ${
      isCompleted 
        ? 'border-green-200 bg-green-50 dark:bg-green-950/20' 
        : 'hover:shadow-md'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getRequirementIcon(requirement.type)}</div>
            <div>
              <h4 className="font-medium text-sm">{getRequirementLabel(requirement.type)}</h4>
              {requirement.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {requirement.description}
                </p>
              )}
            </div>
          </div>
          {isCompleted && (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className={`font-medium ${
              isCompleted ? 'text-green-600' : 'text-foreground'
            }`}>
              {requirement.current} / {requirement.target}
            </span>
          </div>
          <Progress 
            value={Math.min(progress, 100)} 
            className={`h-2 ${
              isCompleted ? '[&>div]:bg-green-600' : ''
            }`}
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{Math.round(progress)}% concluído</span>
            {!isCompleted && requirement.target - requirement.current > 0 && (
              <span>Faltam {requirement.target - requirement.current}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para estatísticas do desafio
function ChallengeStats({ challenge }: { challenge: any }) {
  const totalRequirements = challenge.requirements?.length || 0;
  const completedRequirements = challenge.requirements?.filter((req: any) => 
    req.current >= req.target
  ).length || 0;
  
  const overallProgress = totalRequirements > 0 
    ? (completedRequirements / totalRequirements) * 100 
    : 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-orange-600 bg-orange-100';
      case 'expert': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'uncommon': return 'text-green-600 bg-green-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <Target className="h-6 w-6 mx-auto mb-2 text-blue-600" />
          <div className="text-2xl font-bold">{Math.round(overallProgress)}%</div>
          <div className="text-xs text-muted-foreground">Progresso Geral</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold">{completedRequirements}/{totalRequirements}</div>
          <div className="text-xs text-muted-foreground">Requisitos</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
          <div className="text-2xl font-bold">{challenge.reward_points}</div>
          <div className="text-xs text-muted-foreground">Pontos</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
          <div className="text-2xl font-bold">{challenge.participants_count}</div>
          <div className="text-xs text-muted-foreground">Participantes</div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente principal
export default function ChallengeProgress({ 
  challengeId, 
  variant = 'full',
  showActions = true 
}: ChallengeProgressProps) {
  const [selectedTab, setSelectedTab] = useState('progress');
  
  const { challenges, participations, loading, joinChallenge, leaveChallenge } = useChallenges();
  
  // Encontrar o desafio específico ou usar o primeiro disponível
  const challenge = challengeId 
    ? challenges.find(c => c.id === challengeId)
    : challenges.find(c => !c.is_completed && !c.is_locked) || challenges[0];
  
  const participation = challenge 
    ? participations.find(p => p.challenge_id === challenge.id)
    : null;
  
  const isParticipating = !!participation;
  const isCompleted = participation?.is_completed || false;
  
  // Calcular estatísticas
  const totalRequirements = challenge?.requirements?.length || 0;
  const completedRequirements = challenge?.requirements?.filter((req: any) => 
    req.current >= req.target
  ).length || 0;
  
  const overallProgress = totalRequirements > 0 
    ? (completedRequirements / totalRequirements) * 100 
    : 0;

  const { toast } = useToast();

  // Handlers
  const handleJoinChallenge = async () => {
    if (!challenge) return;
    
    const success = await joinChallenge(challenge.id);
    if (success) {
      toast({
        title: "Sucesso!",
        description: "Você entrou no desafio!",
      });
    }
  };
  
  const handleLeaveChallenge = async () => {
    if (!challenge) return;
    
    const success = await leaveChallenge(challenge.id);
    if (success) {
      toast({
        title: "Sucesso!",
        description: "Você saiu do desafio",
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // No challenge state
  if (!challenge) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Nenhum desafio disponível</h3>
          <p className="text-muted-foreground">
            Não há desafios disponíveis no momento. Volte mais tarde!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Variant minimal
  if (variant === 'minimal') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{challenge.badge_icon}</div>
              <div>
                <h4 className="font-medium">{challenge.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {completedRequirements}/{totalRequirements} requisitos
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{Math.round(overallProgress)}%</div>
              <Progress value={overallProgress} className="w-20 h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Variant compact
  if (variant === 'compact') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{challenge.badge_icon}</div>
              <div>
                <CardTitle className="text-lg">{challenge.title}</CardTitle>
                <CardDescription>{challenge.badge_name}</CardDescription>
              </div>
            </div>
            {isCompleted && (
              <Badge className="bg-green-100 text-green-800">
                <Trophy className="h-3 w-3 mr-1" />
                Concluído
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progresso Geral</span>
                <span className="text-sm text-muted-foreground">
                  {completedRequirements}/{totalRequirements} requisitos
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
            
            {showActions && (
              <div className="flex gap-2">
                {!isParticipating ? (
                  <Button onClick={handleJoinChallenge} size="sm" className="flex-1">
                    Participar
                  </Button>
                ) : (
                  !isCompleted && (
                    <Button 
                      onClick={handleLeaveChallenge} 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                    >
                      Sair do Desafio
                    </Button>
                  )
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Variant full (default)
  return (
    <div className="space-y-6">
      {/* Header do desafio */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{challenge.badge_icon}</div>
              <div>
                <CardTitle className="text-xl">{challenge.title}</CardTitle>
                <CardDescription className="text-base mt-1">
                  {challenge.description}
                </CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`text-xs ${
                    challenge.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    challenge.difficulty === 'hard' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {challenge.difficulty}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {challenge.category}
                  </Badge>
                  <Badge className={`text-xs ${
                    challenge.badge_rarity === 'common' ? 'bg-gray-100 text-gray-800' :
                    challenge.badge_rarity === 'uncommon' ? 'bg-green-100 text-green-800' :
                    challenge.badge_rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                    challenge.badge_rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {challenge.badge_rarity}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              {isCompleted ? (
                <Badge className="bg-green-100 text-green-800">
                  <Trophy className="h-4 w-4 mr-2" />
                  Concluído
                </Badge>
              ) : isParticipating ? (
                <Badge className="bg-blue-100 text-blue-800">
                  <Clock className="h-4 w-4 mr-2" />
                  Em Progresso
                </Badge>
              ) : (
                <Badge variant="outline">
                  Disponível
                </Badge>
              )}
              
              {showActions && (
                <div className="mt-3">
                  {!isParticipating ? (
                    <Button onClick={handleJoinChallenge}>
                      Participar do Desafio
                    </Button>
                  ) : (
                    !isCompleted && (
                      <Button 
                        onClick={handleLeaveChallenge} 
                        variant="outline"
                      >
                        Sair do Desafio
                      </Button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas */}
      <ChallengeStats challenge={challenge} />

      {/* Conteúdo principal */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="progress">Progresso</TabsTrigger>
          <TabsTrigger value="requirements">Requisitos</TabsTrigger>
          <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seu Progresso</CardTitle>
              <CardDescription>
                Acompanhe seu progresso em cada requisito do desafio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Progresso Geral</span>
                  <span className="text-2xl font-bold">{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
                <div className="text-sm text-muted-foreground">
                  {completedRequirements} de {totalRequirements} requisitos concluídos
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="requirements" className="space-y-4">
          <div className="grid gap-4">
            {challenge.requirements?.map((requirement: any, index: number) => {
              const isCompleted = requirement.current >= requirement.target;
              return (
                <RequirementCard
                  key={index}
                  requirement={requirement}
                  isCompleted={isCompleted}
                />
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ranking do Desafio</CardTitle>
              <CardDescription>
                Veja como você está se saindo comparado a outros participantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Ranking em breve</h3>
                <p className="text-muted-foreground">
                  O ranking dos participantes estará disponível em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}