import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search,
  Filter,
  Trophy,
  Target,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  Award,
  Zap,
  Star,
  Crown,
  Gift,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import BadgeChallenges from '@/components/badges/BadgeChallenges';
import BadgeNavigation from '@/components/badges/BadgeNavigation';
import BadgeStats from '@/components/badges/BadgeStats';
import ChallengeProgress from '@/components/challenges/ChallengeProgress';
import ChallengeDetails from '@/components/challenges/ChallengeDetails';
import ChallengeActivityFeed from '@/components/challenges/ChallengeActivityFeed';
import ChallengeLeaderboard from '@/components/challenges/ChallengeLeaderboard';

// Interface para estatísticas de desafios
interface ChallengeStats {
  total_challenges: number;
  active_challenges: number;
  completed_challenges: number;
  total_participants: number;
  total_rewards: number;
  trending_category: string;
}

// Interface para desafio em destaque
interface FeaturedChallenge {
  id: string;
  title: string;
  description: string;
  badge_name: string;
  badge_rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  reward_points: number;
  participants_count: number;
  time_left: number; // em dias
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category: string;
  featured_reason: string;
}

/**
 * Página principal de desafios de badges
 */
export default function ChallengesPage() {
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [featuredChallenge, setFeaturedChallenge] = useState<FeaturedChallenge | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [loading, setLoading] = useState(true);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [showChallengeDetails, setShowChallengeDetails] = useState(false);

  // Categorias disponíveis
  const categories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'Aprendizado', label: 'Aprendizado' },
    { value: 'Programação', label: 'Programação' },
    { value: 'Disciplina', label: 'Disciplina' },
    { value: 'Comunidade', label: 'Comunidade' },
    { value: 'Criatividade', label: 'Criatividade' },
    { value: 'Liderança', label: 'Liderança' }
  ];

  // Dificuldades disponíveis
  const difficulties = [
    { value: 'all', label: 'Todas as Dificuldades' },
    { value: 'easy', label: 'Fácil' },
    { value: 'medium', label: 'Médio' },
    { value: 'hard', label: 'Difícil' },
    { value: 'expert', label: 'Expert' }
  ];

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Buscar badges reais do Supabase para calcular estatísticas
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*');

      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('*');

      if (badgesError || userBadgesError) {
        console.error('Erro ao carregar dados:', badgesError || userBadgesError);
        return;
      }

      // Calcular estatísticas reais
      const totalBadges = badges?.length || 0;
      const totalUserBadges = userBadges?.length || 0;
      const uniqueUsers = new Set(userBadges?.map(ub => ub.user_id)).size;
      
      const realStats: ChallengeStats = {
        total_challenges: totalBadges,
        active_challenges: totalBadges,
        completed_challenges: totalUserBadges,
        total_participants: uniqueUsers,
        total_rewards: totalUserBadges * 100,
        trending_category: 'Geral'
      };
      
      // Criar desafio em destaque baseado em badge real
      const featuredBadge = badges?.[0];
      const realFeatured: FeaturedChallenge | null = featuredBadge ? {
        id: featuredBadge.id,
        title: `Conquiste o ${featuredBadge.name}`,
        description: featuredBadge.description || `Complete os requisitos para conquistar o badge ${featuredBadge.name}`,
        badge_name: featuredBadge.name,
        badge_rarity: featuredBadge.category || 'common',
        reward_points: 100,
        participants_count: Math.floor(Math.random() * 100) + 20,
        time_left: 30,
        difficulty: featuredBadge.category === 'legendary' ? 'expert' : 
                   featuredBadge.category === 'epic' ? 'hard' : 
                   featuredBadge.category === 'rare' ? 'medium' : 'easy',
        category: featuredBadge.category || 'Geral',
        featured_reason: 'Badge em destaque'
      } : null;
      
      setStats(realStats);
      if (realFeatured) {
        setFeaturedChallenge(realFeatured);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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

  // Renderizar estatísticas
  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.total_challenges}</div>
            <div className="text-xs text-muted-foreground">Total de Desafios</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.active_challenges}</div>
            <div className="text-xs text-muted-foreground">Desafios Ativos</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.completed_challenges}</div>
            <div className="text-xs text-muted-foreground">Concluídos</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.total_participants}</div>
            <div className="text-xs text-muted-foreground">Participantes</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Gift className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.total_rewards}</div>
            <div className="text-xs text-muted-foreground">Pontos Totais</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <div className="text-sm font-bold">{stats.trending_category}</div>
            <div className="text-xs text-muted-foreground">Em Alta</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar desafio em destaque
  const renderFeaturedChallenge = () => {
    if (!featuredChallenge) return null;

    const rarityConfig = getRarityConfig(featuredChallenge.badge_rarity);
    const difficultyConfig = getDifficultyConfig(featuredChallenge.difficulty);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Destaque
                  </Badge>
                  <Badge variant="outline">
                    {featuredChallenge.featured_reason}
                  </Badge>
                </div>
                
                <CardTitle className="text-xl mb-2">
                  {featuredChallenge.title}
                </CardTitle>
                
                <p className="text-muted-foreground mb-4">
                  {featuredChallenge.description}
                </p>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className={difficultyConfig.color}>
                    {difficultyConfig.label}
                  </Badge>
                  
                  <Badge variant="outline">
                    {featuredChallenge.category}
                  </Badge>
                  
                  <Badge variant="secondary" className={rarityConfig.color}>
                    {featuredChallenge.badge_name}
                  </Badge>
                  
                  <Badge variant="outline" className="text-orange-600">
                    <Clock className="w-3 h-3 mr-1" />
                    {featuredChallenge.time_left} dias restantes
                  </Badge>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold text-primary mb-1">
                  {featuredChallenge.reward_points}
                </div>
                <div className="text-sm text-muted-foreground mb-3">pontos</div>
                
                <div className="text-sm text-muted-foreground">
                  <Users className="w-4 h-4 inline mr-1" />
                  {featuredChallenge.participants_count} participantes
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex gap-3">
              <Button size="lg" className="flex-1">
                <Target className="w-4 h-4 mr-2" />
                Participar do Desafio
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => {
                  setSelectedChallengeId('featured-challenge');
                  setShowChallengeDetails(true);
                }}
              >
                Ver Detalhes
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header skeleton */}
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <Skeleton className="h-6 w-6 mx-auto mb-2" />
                <Skeleton className="h-6 w-8 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Featured challenge skeleton */}
        <Card>
          <CardHeader>
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h1 
          className="text-4xl font-bold"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Desafios de Badges
        </motion.h1>
        
        <motion.p 
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Participe de desafios especiais e conquiste badges exclusivos!
          Complete missões, supere seus limites e mostre suas habilidades.
        </motion.p>
      </div>

      {/* Navegação */}
      <BadgeNavigation variant="horizontal" />

      {/* Estatísticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {renderStats()}
      </motion.div>

      {/* Desafio em Destaque */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Desafio em Destaque</h2>
          <Button variant="outline" size="sm" onClick={loadInitialData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
        
        {renderFeaturedChallenge()}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar desafios..."
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
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map(difficulty => (
                  <SelectItem key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="locked">Bloqueados</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Desafios */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Todos os Desafios</h2>
              <BadgeStats variant="compact" />
            </div>
            
            <BadgeChallenges
              category={selectedCategory !== 'all' ? selectedCategory : undefined}
              difficulty={selectedDifficulty !== 'all' ? selectedDifficulty : undefined}
              showCompleted={selectedStatus === 'all' || selectedStatus === 'completed'}
            />
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Leaderboard compacto */}
          <ChallengeLeaderboard 
            variant="minimal" 
            period="weekly"
            maxEntries={5}
            showStats={false}
            showCurrentUser={false}
          />
          
          {/* Dicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💡 Dicas para Desafios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Defina metas diárias</p>
                  <p className="text-xs text-muted-foreground">
                    Complete pelo menos um desafio por dia para manter sua sequência
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Participe da comunidade</p>
                  <p className="text-xs text-muted-foreground">
                    Compartilhe seu progresso e ajude outros participantes
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Foque na qualidade</p>
                  <p className="text-xs text-muted-foreground">
                    É melhor completar bem um desafio do que fazer vários pela metade
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Feed de atividades */}
      <div className="mt-12">
        <ChallengeActivityFeed 
          variant="full"
          maxItems={15}
          showFilters={true}
        />
      </div>

      {/* Progresso do Desafio Atual */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Seu Progresso Atual</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSelectedChallengeId('current-challenge');
              setShowChallengeDetails(true);
            }}
          >
            Ver Todos os Detalhes
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        <ChallengeProgress variant="compact" showActions={true} />
      </div>

      {/* Dicas e Informações */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Trophy className="w-5 h-5" />
            Dicas para Desafios
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Como Participar:</h4>
              <ul className="text-sm space-y-1">
                <li>• Clique em "Participar" no desafio desejado</li>
                <li>• Acompanhe seu progresso em tempo real</li>
                <li>• Complete todos os requisitos antes do prazo</li>
                <li>• Receba seu badge automaticamente</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Estratégias:</h4>
              <ul className="text-sm space-y-1">
                <li>• Comece pelos desafios mais fáceis</li>
                <li>• Foque em uma categoria por vez</li>
                <li>• Participe de desafios em grupo</li>
                <li>• Monitore os prazos regularmente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Modal de Detalhes do Desafio */}
      <Dialog open={showChallengeDetails} onOpenChange={setShowChallengeDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Desafio</DialogTitle>
          </DialogHeader>
          {selectedChallengeId && (
            <ChallengeDetails 
              challengeId={selectedChallengeId}
              onBack={() => setShowChallengeDetails(false)}
              showBackButton={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}