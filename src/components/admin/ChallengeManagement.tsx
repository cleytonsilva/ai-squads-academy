import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Trophy, Clock, Target, Filter, Search, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useChallenges, useChallengeStats, useChallengeManagement } from '@/hooks/useChallenges';
import { useBadgeTemplates } from '@/hooks/useBadges';
import { useToast } from '@/hooks/use-toast';

// Interface para formulário de desafio
interface ChallengeFormData {
  title: string;
  description: string;
  badge_id: string;
  requirements: {
    type: 'course_completion' | 'quiz_score' | 'streak' | 'time_spent' | 'projects' | 'community';
    target: number;
    description: string;
  }[];
  reward_points: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category: string;
  time_limit?: string;
  is_active: boolean;
}

// Componente para formulário de desafio
function ChallengeForm({ 
  challenge, 
  onSave, 
  onCancel 
}: { 
  challenge?: any; 
  onSave: (data: ChallengeFormData) => void; 
  onCancel: () => void; 
}) {
  const { templates: badgeTemplates, loading: badgeTemplatesLoading } = useBadgeTemplates();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ChallengeFormData>({
    title: challenge?.title || '',
    description: challenge?.description || '',
    badge_id: challenge?.badge_id || '',
    requirements: challenge?.requirements || [{
      type: 'course_completion',
      target: 1,
      description: 'Complete 1 curso'
    }],
    reward_points: challenge?.reward_points || 100,
    difficulty: challenge?.difficulty || 'easy',
    category: challenge?.category || 'programming',
    time_limit: challenge?.time_limit || '',
    is_active: challenge?.is_active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.title.trim()) {
      toast({ title: "Erro", description: "Título é obrigatório", variant: "destructive" });
      return;
    }
    
    if (!formData.badge_id) {
      toast({ title: "Erro", description: "Badge é obrigatório", variant: "destructive" });
      return;
    }
    
    if (formData.requirements.length === 0) {
      toast({ title: "Erro", description: "Pelo menos um requisito é necessário", variant: "destructive" });
      return;
    }
    
    onSave(formData);
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, {
        type: 'course_completion',
        target: 1,
        description: ''
      }]
    }));
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const updateRequirement = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => 
        i === index ? { ...req, [field]: value } : req
      )
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título do Desafio</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Ex: Mestre em JavaScript"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="badge">Badge Associado</Label>
          <Select
            value={formData.badge_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, badge_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um badge" />
            </SelectTrigger>
            <SelectContent>
              {badgeTemplates && badgeTemplates.length > 0 ? (
                badgeTemplates.map(badge => (
                  <SelectItem key={badge.id} value={badge.id}>
                    <div className="flex items-center gap-2">
                      <span>{badge.style?.icon || '🏆'}</span>
                      <span>{badge.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {badge.category || 'Badge'}
                      </Badge>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>
                  {badgeTemplatesLoading ? 'Carregando badges...' : 'Nenhum badge disponível'}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descreva o desafio e seus objetivos..."
          rows={3}
        />
      </div>

      {/* Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="difficulty">Dificuldade</Label>
          <Select
            value={formData.difficulty}
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Fácil</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="hard">Difícil</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="programming">Programação</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="data-science">Data Science</SelectItem>
              <SelectItem value="devops">DevOps</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="web">Web</SelectItem>
              <SelectItem value="ai">Inteligência Artificial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="points">Pontos de Recompensa</Label>
          <Input
            id="points"
            type="number"
            value={formData.reward_points}
            onChange={(e) => setFormData(prev => ({ ...prev, reward_points: parseInt(e.target.value) || 0 }))}
            min="0"
            step="10"
          />
        </div>
      </div>

      {/* Requisitos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Requisitos do Desafio</Label>
          <Button type="button" onClick={addRequirement} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Requisito
          </Button>
        </div>
        
        {formData.requirements && formData.requirements.map((requirement, index) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={requirement.type}
                  onValueChange={(value: any) => updateRequirement(index, 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course_completion">Completar Cursos</SelectItem>
                    <SelectItem value="quiz_score">Pontuação em Quiz</SelectItem>
                    <SelectItem value="streak">Sequência de Dias</SelectItem>
                    <SelectItem value="time_spent">Tempo de Estudo</SelectItem>
                    <SelectItem value="projects">Projetos Concluídos</SelectItem>
                    <SelectItem value="community">Participação Comunidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Meta</Label>
                <Input
                  type="number"
                  value={requirement.target}
                  onChange={(e) => updateRequirement(index, 'target', parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={requirement.description}
                  onChange={(e) => updateRequirement(index, 'description', e.target.value)}
                  placeholder="Ex: Complete 3 cursos de JavaScript"
                />
              </div>
              
              <Button
                type="button"
                onClick={() => removeRequirement(index)}
                size="sm"
                variant="destructive"
                disabled={!formData.requirements || formData.requirements.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Configurações avançadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="timeLimit">Limite de Tempo (opcional)</Label>
          <Input
            id="timeLimit"
            value={formData.time_limit || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, time_limit: e.target.value }))}
            placeholder="Ex: 30 dias, 1 semana"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="active">Status</Label>
          <Select
            value={formData.is_active ? 'active' : 'inactive'}
            onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'active' }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onCancel} variant="outline">
          Cancelar
        </Button>
        <Button type="submit">
          {challenge ? 'Atualizar' : 'Criar'} Desafio
        </Button>
      </div>
    </form>
  );
}

// Componente principal
export default function ChallengeManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { challenges, loading, refetch } = useChallenges({
    search: searchTerm,
    category: filterCategory !== 'all' ? filterCategory : undefined,
    difficulty: filterDifficulty !== 'all' ? filterDifficulty : undefined,
    status: filterStatus !== 'all' ? filterStatus as any : undefined
  });
  
  const { stats, loading: statsLoading } = useChallengeStats();
  const { createChallenge, updateChallenge, deleteChallenge, loading: actionLoading } = useChallengeManagement();

  // Função para criar desafio
  const handleCreateChallenge = async (data: ChallengeFormData) => {
    const result = await createChallenge(data);
    if (result) {
      setShowCreateDialog(false);
      refetch();
    }
  };

  // Função para editar desafio
  const handleEditChallenge = async (data: ChallengeFormData) => {
    if (!selectedChallenge) return;
    
    const result = await updateChallenge(selectedChallenge.id, data);
    if (result) {
      setShowEditDialog(false);
      setSelectedChallenge(null);
      refetch();
    }
  };

  // Função para deletar desafio
  const handleDeleteChallenge = async (challengeId: string) => {
    const result = await deleteChallenge(challengeId);
    if (result) {
      refetch();
    }
  };

  // Função para obter cor da dificuldade
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter cor do status
  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  // Só mostra loading se realmente não há dados ainda
  if ((loading && challenges.length === 0) || (statsLoading && !stats)) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Desafios</p>
                  <p className="text-2xl font-bold">{stats.total_challenges}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Desafios Ativos</p>
                  <p className="text-2xl font-bold">{stats.active_challenges}</p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Participações</p>
                  <p className="text-2xl font-bold">{challenges.reduce((sum, c) => sum + c.participants_count, 0)}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Conclusão</p>
                  <p className="text-2xl font-bold">
                    {challenges.length > 0 
                      ? Math.round(challenges.reduce((sum, c) => sum + c.completion_rate, 0) / challenges.length)
                      : 0}%
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Desafios</CardTitle>
              <CardDescription>
                Crie e gerencie desafios de badges para engajar os usuários
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Desafio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Desafio</DialogTitle>
                  <DialogDescription>
                    Configure um novo desafio para engajar os usuários
                  </DialogDescription>
                </DialogHeader>
                <ChallengeForm
                  onSave={handleCreateChallenge}
                  onCancel={() => setShowCreateDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar desafios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="programming">Programação</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="data-science">Data Science</SelectItem>
                <SelectItem value="devops">DevOps</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="web">Web</SelectItem>
                <SelectItem value="ai">IA</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Dificuldades</SelectItem>
                <SelectItem value="easy">Fácil</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="hard">Difícil</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="locked">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de desafios */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Desafio</TableHead>
                  <TableHead>Badge</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Dificuldade</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Taxa de Conclusão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challenges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm || filterCategory !== 'all' || filterDifficulty !== 'all' || filterStatus !== 'all'
                          ? 'Nenhum desafio encontrado com os filtros aplicados'
                          : 'Nenhum desafio criado ainda'
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  challenges.map((challenge) => (
                    <TableRow key={challenge.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{challenge.title}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {challenge.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{challenge.badge_icon}</span>
                          <span className="text-sm">{challenge.badge_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {challenge.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDifficultyColor(challenge.difficulty)}>
                          {challenge.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{challenge.participants_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={challenge.completion_rate} className="w-16" />
                          <span className="text-sm">{challenge.completion_rate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(challenge.is_active)}>
                          {challenge.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedChallenge(challenge);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedChallenge(challenge);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deletar Desafio</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja deletar o desafio "{challenge.title}"? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteChallenge(challenge.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Deletar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Desafio</DialogTitle>
            <DialogDescription>
              Modifique as configurações do desafio
            </DialogDescription>
          </DialogHeader>
          {selectedChallenge && (
            <ChallengeForm
              challenge={selectedChallenge}
              onSave={handleEditChallenge}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedChallenge(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de detalhes */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Desafio</DialogTitle>
          </DialogHeader>
          {selectedChallenge && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Título</Label>
                  <p className="text-sm text-muted-foreground">{selectedChallenge.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Badge</Label>
                  <div className="flex items-center gap-2">
                    <span>{selectedChallenge.badge_icon}</span>
                    <span className="text-sm">{selectedChallenge.badge_name}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Descrição</Label>
                <p className="text-sm text-muted-foreground">{selectedChallenge.description}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Categoria</Label>
                  <p className="text-sm text-muted-foreground capitalize">{selectedChallenge.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Dificuldade</Label>
                  <Badge className={getDifficultyColor(selectedChallenge.difficulty)}>
                    {selectedChallenge.difficulty}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Pontos</Label>
                  <p className="text-sm text-muted-foreground">{selectedChallenge.reward_points}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Requisitos</Label>
                <div className="space-y-2 mt-2">
                  {selectedChallenge.requirements.map((req: any, index: number) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">
                          {req.type.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Meta: {req.target}
                        </span>
                      </div>
                      {req.description && (
                        <p className="text-sm text-muted-foreground mt-1">{req.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Participantes</Label>
                  <p className="text-sm text-muted-foreground">{selectedChallenge.participants_count}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Taxa de Conclusão</Label>
                  <p className="text-sm text-muted-foreground">{selectedChallenge.completion_rate}%</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}