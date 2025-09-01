import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Award, 
  Star, 
  Trophy, 
  Target, 
  Clock, 
  CheckCircle,
  Users,
  TrendingUp,
  Eye,
  Settings,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
}

interface BadgeTemplate {
  id?: string;
  name: string;
  description: string;
  image_url: string;
  style: any;
  category: string;
  key: string;
  is_active?: boolean;
  color?: string;
  criteria?: string;
  course_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  user: {
    full_name: string;
    email: string;
  };
  badge: {
    name: string;
    description: string;
    image_url: string;
    style: any;
  };
}

interface BadgeStats {
  total_awarded: number;
  unique_recipients: number;
  recent_awards: UserBadge[];
}

/**
 * Componente para gerenciamento de badges - APENAS PARA ADMINISTRADORES
 * Administradores criam, editam e monitoram badges, mas NÃO acumulam badges
 */
export default function AdminBadgeManagement() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [badgeStats, setBadgeStats] = useState<Record<string, BadgeStats>>({});
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BadgeTemplate | null>(null);
  const [formData, setFormData] = useState<BadgeTemplate>({
    name: '',
    description: '',
    image_url: '',
    style: { color: '#3B82F6', icon: 'award' },
    category: 'achievement',
    key: '',
    is_active: true,
    color: '#3B82F6',
    criteria: '',
    course_id: undefined,
  });

  // Ícones disponíveis
  const availableIcons = [
    { name: 'award', icon: Award, label: 'Prêmio' },
    { name: 'star', icon: Star, label: 'Estrela' },
    { name: 'trophy', icon: Trophy, label: 'Troféu' },
    { name: 'target', icon: Target, label: 'Alvo' },
    { name: 'clock', icon: Clock, label: 'Relógio' },
    { name: 'check', icon: CheckCircle, label: 'Check' },
  ];

  // Cores predefinidas
  const availableColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ];

  // Categorias de badges
  const badgeCategories = [
    { value: 'achievement', label: 'Conquista' },
    { value: 'course', label: 'Curso' },
    { value: 'challenge', label: 'Desafio' },
    { value: 'participation', label: 'Participação' },
    { value: 'milestone', label: 'Marco' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTemplates(),
        loadCourses(),
        loadBadgeStats()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({ title: "Erro", description: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('badges')
      .select(`
        id,
        name,
        description,
        image_url,
        style,
        category,
        key,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar templates:', error);
      return;
    }

    setTemplates(data || []);
  };

  const loadCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title')
      .eq('is_published', true)
      .order('title');

    if (error) {
      console.error('Erro ao carregar cursos:', error);
      return;
    }

    setCourses(data || []);
  };

  const loadBadgeStats = async () => {
    const { data: userBadges, error } = await supabase
      .from('user_badges')
      .select(`
        id,
        user_id,
        badge_id,
        earned_at,
        badges (
          id,
          name,
          description,
          image_url,
          style
        )
      `)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar estatísticas:', error);
      return;
    }

    // Agrupar estatísticas por badge
    const stats: Record<string, BadgeStats> = {};
    
    userBadges?.forEach((userBadge) => {
      const badgeId = userBadge.badge_id;
      if (!stats[badgeId]) {
        stats[badgeId] = {
          total_awarded: 0,
          unique_recipients: new Set(),
          recent_awards: []
        };
      }
      
      stats[badgeId].total_awarded++;
      stats[badgeId].unique_recipients.add(userBadge.user_id);
      
      if (stats[badgeId].recent_awards.length < 5) {
        stats[badgeId].recent_awards.push(userBadge as UserBadge);
      }
    });

    // Converter Set para número
    Object.keys(stats).forEach(badgeId => {
      stats[badgeId].unique_recipients = stats[badgeId].unique_recipients.size;
    });

    setBadgeStats(stats as Record<string, BadgeStats>);
  };

  const handleCreateTemplate = async () => {
    try {
      const { error } = await supabase
        .from('badges')
        .insert([formData]);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Template de badge criado com sucesso!" });
      setIsCreateDialogOpen(false);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast({ title: "Erro", description: "Erro ao criar template de badge", variant: "destructive" });
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate?.id) return;

    try {
      const { error } = await supabase
        .from('badges')
        .update(formData)
        .eq('id', selectedTemplate.id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Template atualizado com sucesso!" });
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      toast({ title: "Erro", description: "Erro ao atualizar template", variant: "destructive" });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Template excluído com sucesso!" });
      loadTemplates();
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast({ title: "Erro", description: "Erro ao excluir template", variant: "destructive" });
    }
  };

  const handleToggleActive = async (template: BadgeTemplate) => {
    try {
      // Funcionalidade de ativar/desativar não disponível na estrutura atual
      toast.info('Funcionalidade de ativar/desativar será implementada em breve');
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({ title: "Erro", description: "Erro ao alterar status do template", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      style: { color: '#3B82F6', icon: 'award' },
      category: 'achievement',
      key: '',
    });
  };

  const openEditDialog = (template: BadgeTemplate) => {
    setSelectedTemplate(template);
    setFormData({ ...template });
    setIsEditDialogOpen(true);
  };

  const getIconComponent = (iconName: string) => {
    const iconData = availableIcons.find(icon => icon.name === iconName);
    return iconData ? iconData.icon : Award;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Badges</h1>
          <p className="text-muted-foreground">
            Crie e monitore badges para reconhecer conquistas dos alunos
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Badge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Badge</DialogTitle>
              <DialogDescription>
                Configure um novo template de badge para reconhecer conquistas dos alunos
              </DialogDescription>
            </DialogHeader>
            <BadgeForm
              formData={formData}
              setFormData={setFormData}
              courses={courses}
              availableIcons={availableIcons}
              availableColors={availableColors}
              badgeCategories={badgeCategories}
              onSubmit={handleCreateTemplate}
              onCancel={() => setIsCreateDialogOpen(false)}
              submitLabel="Criar Badge"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Templates</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">
              {templates.filter(t => t.is_active).length} ativos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Concedidos</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(badgeStats).reduce((sum, stats) => sum + stats.total_awarded, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de badges concedidos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos Premiados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(Object.values(badgeStats).flatMap(stats => 
                stats.recent_awards.map(award => award.user_id)
              )).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuários únicos com badges
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engajamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.length > 0 ? 
                Math.round(Object.values(badgeStats).reduce((sum, stats) => sum + stats.total_awarded, 0) / templates.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Média de badges por template
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes visualizações */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates de Badges</TabsTrigger>
          <TabsTrigger value="analytics">Análise e Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <TemplatesGrid
            templates={templates}
            badgeStats={badgeStats}
            getIconComponent={getIconComponent}
            onEdit={openEditDialog}
            onDelete={handleDeleteTemplate}
            onToggleActive={handleToggleActive}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsView
            templates={templates}
            badgeStats={badgeStats}
            getIconComponent={getIconComponent}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Badge</DialogTitle>
            <DialogDescription>
              Modifique as configurações do template de badge
            </DialogDescription>
          </DialogHeader>
          <BadgeForm
            formData={formData}
            setFormData={setFormData}
            courses={courses}
            availableIcons={availableIcons}
            availableColors={availableColors}
            badgeCategories={badgeCategories}
            onSubmit={handleUpdateTemplate}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setSelectedTemplate(null);
              resetForm();
            }}
            submitLabel="Atualizar Badge"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente do formulário de badge
interface BadgeFormProps {
  formData: BadgeTemplate;
  setFormData: (data: BadgeTemplate) => void;
  courses: Course[];
  availableIcons: any[];
  availableColors: string[];
  badgeCategories: any[];
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}

function BadgeForm({
  formData,
  setFormData,
  courses,
  availableIcons,
  availableColors,
  badgeCategories,
  onSubmit,
  onCancel,
  submitLabel
}: BadgeFormProps) {
  const getIconComponent = (iconName: string) => {
    const iconData = availableIcons.find(icon => icon.name === iconName);
    return iconData ? iconData.icon : Award;
  };

  const IconComponent = getIconComponent(formData.style?.icon || 'award');

  return (
    <div className="space-y-6">
      {/* Preview do Badge */}
      <div className="flex items-center justify-center p-6 bg-muted/50 rounded-lg">
        <div className="flex flex-col items-center space-y-2">
          <div 
            className="p-4 rounded-full"
            style={{ backgroundColor: formData.color + '20', color: formData.color }}
          >
            <IconComponent className="h-8 w-8" />
          </div>
          <h3 className="font-semibold">{formData.name || 'Nome do Badge'}</h3>
          <p className="text-sm text-muted-foreground text-center">
            {formData.description || 'Descrição do badge'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome do badge"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {badgeCategories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição do que o aluno precisa fazer para ganhar este badge"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="criteria">Critérios de Conquista</Label>
        <Textarea
          id="criteria"
          value={formData.criteria}
          onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
          placeholder="Critérios específicos para ganhar este badge (ex: completar 5 cursos, obter 80% em um quiz)"
          rows={2}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="key">Chave do Badge</Label>
          <Input
            id="key"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            placeholder="chave-unica-badge"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="course">Curso Relacionado (Opcional)</Label>
          <Select
            value={formData.course_id || ''}
            onValueChange={(value) => setFormData({ ...formData, course_id: value || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum curso específico</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Ícone</Label>
          <div className="grid grid-cols-6 gap-2">
            {availableIcons.map((icon) => {
              const IconComp = icon.icon;
              return (
                <button
                  key={icon.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, style: { ...formData.style, icon: icon.name } })}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-colors",
                    formData.style?.icon === icon.name
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <IconComp className="h-5 w-5 mx-auto" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Cor</Label>
          <div className="grid grid-cols-8 gap-2">
            {availableColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, style: { ...formData.style, color } })}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  formData.style?.color === color
                    ? "border-primary scale-110"
                    : "border-muted hover:scale-105"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

// Componente da grade de templates
interface TemplatesGridProps {
  templates: BadgeTemplate[];
  badgeStats: Record<string, BadgeStats>;
  getIconComponent: (iconName: string) => any;
  onEdit: (template: BadgeTemplate) => void;
  onDelete: (templateId: string) => void;
  onToggleActive: (template: BadgeTemplate) => void;
}

function TemplatesGrid({
  templates,
  badgeStats,
  getIconComponent,
  onEdit,
  onDelete,
  onToggleActive
}: TemplatesGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => {
        const IconComponent = getIconComponent(template.style?.icon || 'award');
        const stats = badgeStats[template.id!] || { total_awarded: 0, unique_recipients: 0, recent_awards: [] };

        return (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: template.style?.color + '20', color: template.style?.color }}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Template</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(template.id!)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Concedidos:</span>
                  <p className="text-muted-foreground">{stats.total_awarded}</p>
                </div>
                <div>
                  <span className="font-medium">Alunos:</span>
                  <p className="text-muted-foreground">{stats.unique_recipients}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <Badge variant="default">
                  Ativo
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(template)}
                >
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Componente de análise
interface AnalyticsViewProps {
  templates: BadgeTemplate[];
  badgeStats: Record<string, BadgeStats>;
  getIconComponent: (iconName: string) => any;
}

function AnalyticsView({ templates, badgeStats, getIconComponent }: AnalyticsViewProps) {
  const topPerformingBadges = templates
    .map(template => ({
      ...template,
      stats: badgeStats[template.id!] || { total_awarded: 0, unique_recipients: 0, recent_awards: [] }
    }))
    .sort((a, b) => b.stats.total_awarded - a.stats.total_awarded)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Top 5 Badges Mais Concedidos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Badge</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Total Concedido</TableHead>
                <TableHead>Alunos Únicos</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPerformingBadges.map((badge) => {
                const IconComponent = getIconComponent(badge.style?.icon || 'award');
                return (
                  <TableRow key={badge.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: badge.style?.color + '20', color: badge.style?.color }}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{badge.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {badge.description.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{badge.category}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {badge.stats.total_awarded}
                    </TableCell>
                    <TableCell>
                      {badge.stats.unique_recipients}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        Ativo
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Atividade Recente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Atividade Recente</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.values(badgeStats)
              .flatMap(stats => stats.recent_awards)
              .sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
              .slice(0, 10)
              .map((award, index) => {
                const IconComponent = getIconComponent(award.badge.style?.icon || 'award');
                return (
                  <div key={`${award.id}-${index}`} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: award.badge.style?.color + '20', color: award.badge.style?.color }}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{award.user.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Conquistou o badge "{award.badge.name}"
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(award.earned_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}