import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Target, 
  Trophy, 
  Users, 
  Star, 
  CheckCircle, 
  AlertCircle,
  Share2,
  Bookmark,
  BookmarkCheck,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useChallenges } from '@/hooks/useChallenges';
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interface para props do componente
interface ChallengeDetailsProps {
  challengeId: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

// Componente para exibir um requisito detalhado
function DetailedRequirement({ 
  requirement, 
  index 
}: { 
  requirement: any; 
  index: number; 
}) {
  const progress = requirement.target > 0 ? (requirement.current / requirement.target) * 100 : 0;
  const isCompleted = requirement.current >= requirement.target;
  
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
  
  const getRequirementTitle = (type: string) => {
    switch (type) {
      case 'course_completion': return 'Conclusão de Cursos';
      case 'quiz_score': return 'Pontuação em Quiz';
      case 'streak': return 'Sequência de Estudos';
      case 'time_spent': return 'Tempo de Estudo';
      case 'projects': return 'Projetos Concluídos';
      case 'community': return 'Participação na Comunidade';
      default: return 'Requisito Personalizado';
    }
  };
  
  const getRequirementDescription = (req: any) => {
    switch (req.type) {
      case 'course_completion':
        return `Complete ${req.target} curso${req.target > 1 ? 's' : ''} para cumprir este requisito.`;
      case 'quiz_score':
        return `Obtenha uma pontuação de pelo menos ${req.target} pontos em quizzes.`;
      case 'streak':
        return `Mantenha uma sequência de ${req.target} dia${req.target > 1 ? 's' : ''} estudando.`;
      case 'time_spent':
        return `Dedique pelo menos ${req.target} horas aos estudos.`;
      case 'projects':
        return `Complete ${req.target} projeto${req.target > 1 ? 's' : ''}.`;
      case 'community':
        return `Participe ${req.target} vez${req.target > 1 ? 'es' : ''} em discussões da comunidade.`;
      default:
        return req.description || 'Complete este requisito para avançar no desafio.';
    }
  };

  return (
    <Card className={`transition-all duration-200 ${
      isCompleted 
        ? 'border-green-200 bg-green-50 dark:bg-green-950/20' 
        : 'hover:shadow-md'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getRequirementIcon(requirement.type)}</div>
            <div>
              <CardTitle className="text-base">
                {index + 1}. {getRequirementTitle(requirement.type)}
              </CardTitle>
              <CardDescription className="mt-1">
                {getRequirementDescription(requirement)}
              </CardDescription>
            </div>
          </div>
          {isCompleted && (
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progresso</span>
            <span className={`text-sm font-medium ${
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
          
          {requirement.tips && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Dica</p>
                  <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                    {requirement.tips}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para exibir recompensas
function RewardsSection({ challenge }: { challenge: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Recompensas
        </CardTitle>
        <CardDescription>
          O que você ganhará ao completar este desafio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Badge */}
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="text-3xl">{challenge.badge_icon}</div>
            <div className="flex-1">
              <h4 className="font-medium">{challenge.badge_name}</h4>
              <p className="text-sm text-muted-foreground">
                Badge exclusivo do desafio
              </p>
              <Badge className={`mt-2 text-xs ${
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
          
          {/* Pontos */}
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Star className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium">{challenge.reward_points} Pontos</h4>
              <p className="text-sm text-muted-foreground">
                Pontos de experiência para seu perfil
              </p>
            </div>
          </div>
          
          {/* Benefícios adicionais */}
          {challenge.additional_rewards && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Benefícios Adicionais</h4>
              <ul className="space-y-1">
                {challenge.additional_rewards.map((reward: string, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {reward}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para estatísticas do desafio
function ChallengeStatistics({ challenge }: { challenge: any }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
          <div className="text-2xl font-bold">{challenge.participants_count || 0}</div>
          <div className="text-xs text-muted-foreground">Participantes</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold">{challenge.completion_rate || 0}%</div>
          <div className="text-xs text-muted-foreground">Taxa de Conclusão</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Clock className="h-6 w-6 mx-auto mb-2 text-orange-600" />
          <div className="text-2xl font-bold">{challenge.avg_completion_time || 'N/A'}</div>
          <div className="text-xs text-muted-foreground">Tempo Médio</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <Star className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
          <div className="text-2xl font-bold">{challenge.difficulty_rating || 'N/A'}</div>
          <div className="text-xs text-muted-foreground">Avaliação</div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente principal
export default function ChallengeDetails({ 
  challengeId, 
  onBack,
  showBackButton = true 
}: ChallengeDetailsProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const { 
    challenges, 
    participations, 
    loading, 
    joinChallenge, 
    leaveChallenge,
    resetProgress 
  } = useChallenges();
  
  // Encontrar o desafio específico
  const challenge = challenges.find(c => c.id === challengeId);
  const participation = challenge 
    ? participations.find(p => p.challenge_id === challenge.id)
    : null;
  
  const isParticipating = !!participation;
  const isCompleted = participation?.is_completed || false;
  
  // Calcular progresso
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
  
  const handleResetProgress = async () => {
    if (!challenge) return;
    
    const success = await resetProgress(challenge.id);
    if (success) {
      toast({
        title: "Sucesso!",
        description: "Progresso reiniciado",
      });
    }
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: challenge?.title,
          text: challenge?.description,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback para clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Sucesso!",
          description: "Link copiado para a área de transferência!",
        });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Sucesso!",
        description: "Link copiado para a área de transferência!",
      });
    }
  };
  
  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: "Sucesso!",
      description: isBookmarked ? "Removido dos favoritos" : "Adicionado aos favoritos",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {showBackButton && <Skeleton className="h-10 w-10" />}
          <Skeleton className="h-8 w-64" />
        </div>
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

  // Challenge not found
  if (!challenge) {
    return (
      <div className="space-y-6">
        {showBackButton && onBack && (
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        )}
        
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Desafio não encontrado</h3>
            <p className="text-muted-foreground">
              O desafio que você está procurando não existe ou foi removido.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && onBack && (
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">{challenge.title}</h1>
            <p className="text-muted-foreground">{challenge.category}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={toggleBookmark}>
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Card principal do desafio */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{challenge.badge_icon}</div>
              <div>
                <CardTitle className="text-xl">{challenge.badge_name}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {challenge.description}
                </CardDescription>
                <div className="flex items-center gap-2 mt-3">
                  <Badge className={`${
                    challenge.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    challenge.difficulty === 'hard' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {challenge.difficulty}
                  </Badge>
                  <Badge className={`${
                    challenge.badge_rarity === 'common' ? 'bg-gray-100 text-gray-800' :
                    challenge.badge_rarity === 'uncommon' ? 'bg-green-100 text-green-800' :
                    challenge.badge_rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                    challenge.badge_rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {challenge.badge_rarity}
                  </Badge>
                  {challenge.start_date && (
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(challenge.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              {isCompleted ? (
                <Badge className="bg-green-100 text-green-800 mb-3">
                  <Trophy className="h-4 w-4 mr-2" />
                  Concluído
                </Badge>
              ) : isParticipating ? (
                <Badge className="bg-blue-100 text-blue-800 mb-3">
                  <Clock className="h-4 w-4 mr-2" />
                  Em Progresso
                </Badge>
              ) : (
                <Badge variant="outline" className="mb-3">
                  Disponível
                </Badge>
              )}
              
              <div className="space-y-2">
                {!isParticipating ? (
                  <Button onClick={handleJoinChallenge} className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Participar
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {!isCompleted && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <Pause className="h-4 w-4 mr-2" />
                            Sair
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Sair do desafio?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Você perderá todo o progresso atual neste desafio. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLeaveChallenge}>
                              Sair do Desafio
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    
                    {isParticipating && !isCompleted && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reiniciar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reiniciar progresso?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso irá zerar todo o seu progresso atual neste desafio. Você poderá começar novamente do zero.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResetProgress}>
                              Reiniciar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        {isParticipating && (
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Progresso Geral</span>
                <span className="text-lg font-bold">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
              <div className="text-sm text-muted-foreground">
                {completedRequirements} de {totalRequirements} requisitos concluídos
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Estatísticas */}
      <ChallengeStatistics challenge={challenge} />

      {/* Conteúdo em abas */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="requirements">Requisitos</TabsTrigger>
          <TabsTrigger value="rewards">Recompensas</TabsTrigger>
          <TabsTrigger value="community">Comunidade</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sobre este Desafio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p>{challenge.long_description || challenge.description}</p>
                
                {challenge.learning_objectives && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Objetivos de Aprendizagem</h4>
                    <ul className="space-y-1">
                      {challenge.learning_objectives.map((objective: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {challenge.prerequisites && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Pré-requisitos</h4>
                    <ul className="space-y-1">
                      {challenge.prerequisites.map((prereq: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{prereq}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="requirements" className="space-y-4">
          <div className="space-y-4">
            {challenge.requirements?.map((requirement: any, index: number) => (
              <DetailedRequirement
                key={index}
                requirement={requirement}
                index={index}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="rewards" className="space-y-4">
          <RewardsSection challenge={challenge} />
        </TabsContent>
        
        <TabsContent value="community" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comunidade do Desafio</CardTitle>
              <CardDescription>
                Conecte-se com outros participantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Em breve</h3>
                <p className="text-muted-foreground">
                  A seção da comunidade estará disponível em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}