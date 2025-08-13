import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBadges } from '@/hooks/useBadges';
import { Award, Star, Trophy, Target, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BadgeDisplayProps {
  userId?: string;
  compact?: boolean;
  showProgress?: boolean;
  className?: string;
}

/**
 * Componente para exibir badges do usuário
 */
export default function BadgeDisplay({ 
  userId, 
  compact = false, 
  showProgress = true, 
  className 
}: BadgeDisplayProps) {
  const {
    badges,
    availableBadges,
    badgeProgress,
    loading,
    error,
    totalBadges,
    totalAvailableBadges,
    completionRate,
    checkForNewBadges,
  } = useBadges(userId);

  const [selectedBadge, setSelectedBadge] = useState<any>(null);

  /**
   * Retorna ícone baseado no nome
   */
  const getIconByName = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      award: Award,
      star: Star,
      trophy: Trophy,
      target: Target,
      clock: Clock,
      check: CheckCircle,
    };
    
    const IconComponent = icons[iconName.toLowerCase()] || Award;
    return <IconComponent className="w-6 h-6" />;
  };

  /**
   * Formata data de conquista
   */
  const formatEarnedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  /**
   * Renderiza badge conquistado
   */
  const renderEarnedBadge = (badge: any) => (
    <TooltipProvider key={badge.id}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={cn(
              "cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
              compact ? "p-2" : "p-4",
              className
            )}
            onClick={() => setSelectedBadge(badge)}
          >
            <CardContent className={cn("flex flex-col items-center text-center", compact ? "p-2" : "p-4")}>
              <div 
                className={cn(
                  "rounded-full flex items-center justify-center mb-2",
                  compact ? "w-12 h-12" : "w-16 h-16"
                )}
                style={{ backgroundColor: badge.badge_template.color || '#3B82F6' }}
              >
                <div className="text-white">
                  {getIconByName(badge.badge_template.style?.icon || 'award')}
                </div>
              </div>
              
              <h4 className={cn("font-semibold", compact ? "text-sm" : "text-base")}>
                {badge.badge_template.title}
              </h4>
              
              {!compact && (
                <>
                  <p className="text-sm text-muted-foreground mt-1">
                    {badge.badge_template.description}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Conquistado em {formatEarnedDate(badge.earned_at)}
                  </Badge>
                </>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className="font-semibold">{badge.badge_template.title}</p>
            <p className="text-sm">{badge.badge_template.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Conquistado em {formatEarnedDate(badge.earned_at)}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  /**
   * Renderiza badge disponível (não conquistado)
   */
  const renderAvailableBadge = (template: any) => {
    const progress = badgeProgress.find(p => p.badge_template_id === template.id);
    const isEarned = progress?.is_earned || false;
    
    if (isEarned) return null; // Não mostrar se já foi conquistado

    return (
      <TooltipProvider key={template.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card 
              className={cn(
                "cursor-pointer transition-all hover:scale-105 hover:shadow-lg opacity-60",
                compact ? "p-2" : "p-4",
                className
              )}
              onClick={() => setSelectedBadge({ badge_template: template, available: true })}
            >
              <CardContent className={cn("flex flex-col items-center text-center", compact ? "p-2" : "p-4")}>
                <div 
                  className={cn(
                    "rounded-full flex items-center justify-center mb-2 border-2 border-dashed",
                    compact ? "w-12 h-12" : "w-16 h-16"
                  )}
                  style={{ borderColor: template.color || '#3B82F6' }}
                >
                  <div style={{ color: template.color || '#3B82F6' }}>
                    {getIconByName(template.style?.icon || 'award')}
                  </div>
                </div>
                
                <h4 className={cn("font-semibold", compact ? "text-sm" : "text-base")}>
                  {template.title}
                </h4>
                
                {!compact && (
                  <>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                    
                    {progress && showProgress && (
                      <div className="w-full mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progresso</span>
                          <span>{Math.round(progress.progress_percentage)}%</span>
                        </div>
                        <Progress value={progress.progress_percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {progress.current_points} / {progress.required_points} pontos
                        </p>
                      </div>
                    )}
                    
                    <Badge variant="outline" className="mt-2">
                      100 pontos necessários
                    </Badge>
                  </>
                )}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs">
              <p className="font-semibold">{template.title}</p>
              <p className="text-sm">{template.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                100 pontos necessários
              </p>
              {progress && (
                <p className="text-xs text-muted-foreground">
                  Progresso: {Math.round(progress.progress_percentage)}%
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  /**
   * Renderiza estatísticas
   */
  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{totalBadges}</div>
          <p className="text-sm text-muted-foreground">Badges Conquistados</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-secondary">{totalAvailableBadges}</div>
          <p className="text-sm text-muted-foreground">Badges Disponíveis</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{Math.round(completionRate)}%</div>
          <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Carregando badges...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>Erro ao carregar badges: {error}</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </Button>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3", className)}>
        {badges.map(renderEarnedBadge)}
        {availableBadges.slice(0, 6).map(renderAvailableBadge)}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Estatísticas */}
      {!compact && renderStats()}
      
      {/* Botão para verificar novos badges */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Seus Badges</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={checkForNewBadges}
          className="flex items-center gap-2"
        >
          <Trophy className="w-4 h-4" />
          Verificar Novos Badges
        </Button>
      </div>

      {/* Tabs para badges conquistados e disponíveis */}
      <Tabs defaultValue="earned" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="earned" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Conquistados ({totalBadges})
          </TabsTrigger>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Disponíveis ({totalAvailableBadges - totalBadges})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="earned" className="mt-6">
          {badges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {badges.map(renderEarnedBadge)}
            </div>
          ) : (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Você ainda não conquistou nenhum badge.</p>
                <p className="text-sm mt-2">Complete cursos e atividades para ganhar seus primeiros badges!</p>
              </div>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="available" className="mt-6">
          {availableBadges.filter(template => 
            !badges.some(badge => badge.badge_template_id === template.id)
          ).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {availableBadges.map(renderAvailableBadge)}
            </div>
          ) : (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Parabéns! Você conquistou todos os badges disponíveis!</p>
                <p className="text-sm mt-2">Fique atento a novos badges que serão adicionados.</p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de detalhes do badge */}
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="max-w-md">
          {selectedBadge && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: selectedBadge.badge_template.color || '#3B82F6' }}
                  >
                    <div className="text-white">
                      {getIconByName(selectedBadge.badge_template.style?.icon || 'award')}
                    </div>
                  </div>
                  <div>
                    <DialogTitle>{selectedBadge.badge_template.title}</DialogTitle>
                    <DialogDescription>
                      {selectedBadge.badge_template.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Critérios */}
                <div>
                  <h4 className="font-semibold mb-2">Critérios para Conquista:</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedBadge.badge_template.criteria || 'Critérios não especificados'}
                  </p>
                </div>
                
                {/* Pontos necessários */}
                <div>
                  <h4 className="font-semibold mb-2">Pontos Necessários:</h4>
                  <Badge variant="secondary">
                    100 pontos
                  </Badge>
                </div>
                
                {/* Curso relacionado */}
                {selectedBadge.badge_template.course && (
                  <div>
                    <h4 className="font-semibold mb-2">Curso Relacionado:</h4>
                    <Badge variant="outline">
                      {selectedBadge.badge_template.course.title}
                    </Badge>
                  </div>
                )}
                
                {/* Data de conquista ou progresso */}
                {selectedBadge.available ? (
                  <div>
                    <h4 className="font-semibold mb-2">Seu Progresso:</h4>
                    {badgeProgress.find(p => p.badge_template_id === selectedBadge.badge_template.id) && (
                      <div className="space-y-2">
                        <Progress 
                          value={badgeProgress.find(p => p.badge_template_id === selectedBadge.badge_template.id)?.progress_percentage || 0} 
                        />
                        <p className="text-sm text-muted-foreground">
                          {badgeProgress.find(p => p.badge_template_id === selectedBadge.badge_template.id)?.current_points || 0} / 100 pontos
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h4 className="font-semibold mb-2">Data de Conquista:</h4>
                    <Badge variant="secondary">
                      {formatEarnedDate(selectedBadge.earned_at)}
                    </Badge>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}