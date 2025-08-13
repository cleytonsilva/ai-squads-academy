import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
}

interface BadgeTemplate {
  id?: string;
  name: string;
  description: string;
  course_id: string;
  design_config: {
    background_color: string;
    text_color: string;
    border_style: string;
    icon: string;
  };
  requirements: {
    completion_percentage: number;
    min_score?: number;
    required_modules: string[];
  };
  is_active: boolean;
}

const ICON_OPTIONS = [
  { value: 'trophy', label: '🏆 Troféu' },
  { value: 'medal', label: '🏅 Medalha' },
  { value: 'star', label: '⭐ Estrela' },
  { value: 'crown', label: '👑 Coroa' },
  { value: 'gem', label: '💎 Diamante' },
  { value: 'shield', label: '🛡️ Escudo' },
  { value: 'target', label: '🎯 Alvo' },
  { value: 'rocket', label: '🚀 Foguete' }
];

const BORDER_STYLES = [
  { value: 'solid', label: 'Sólida' },
  { value: 'dashed', label: 'Tracejada' },
  { value: 'dotted', label: 'Pontilhada' },
  { value: 'double', label: 'Dupla' },
  { value: 'none', label: 'Sem borda' }
];

export default function BadgeEditor() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [badgeTemplates, setBadgeTemplates] = useState<BadgeTemplate[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [formData, setFormData] = useState<BadgeTemplate>({
    name: '',
    description: '',
    course_id: '',
    design_config: {
      background_color: '#1e40af',
      text_color: '#ffffff',
      border_style: 'solid',
      icon: 'trophy'
    },
    requirements: {
      completion_percentage: 100,
      min_score: undefined,
      required_modules: []
    },
    is_active: true
  });

  // Load courses
  useEffect(() => {
    loadCourses();
  }, []);

  // Load badge templates when course is selected
  useEffect(() => {
    if (selectedCourse) {
      loadBadgeTemplates();
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_published', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os cursos',
        variant: 'destructive'
      });
    }
  };

  const loadBadgeTemplates = async () => {
    if (!selectedCourse) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('badge_templates')
        .select('*')
        .eq('course_id', selectedCourse)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBadgeTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates de badge:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os templates de badge',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !selectedCourse) {
      toast({
        title: 'Erro',
        description: 'Nome e curso são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      const dataToSave = {
        ...formData,
        course_id: selectedCourse
      };

      if (editingBadge?.id) {
        // Update existing badge template
        const { error } = await supabase
          .from('badge_templates')
          .update(dataToSave)
          .eq('id', editingBadge.id);

        if (error) throw error;
        toast({
          title: 'Sucesso',
          description: 'Template de badge atualizado com sucesso'
        });
      } else {
        // Create new badge template
        const { error } = await supabase
          .from('badge_templates')
          .insert([dataToSave]);

        if (error) throw error;
        toast({
          title: 'Sucesso',
          description: 'Template de badge criado com sucesso'
        });
      }

      // Reset form and reload templates
      resetForm();
      loadBadgeTemplates();
    } catch (error) {
      console.error('Erro ao salvar template de badge:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o template de badge',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template de badge?')) {
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('badge_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: 'Template de badge excluído com sucesso'
      });
      
      loadBadgeTemplates();
    } catch (error) {
      console.error('Erro ao excluir template de badge:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o template de badge',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (badge: BadgeTemplate) => {
    setEditingBadge(badge);
    setFormData(badge);
  };

  const resetForm = () => {
    setEditingBadge(null);
    setFormData({
      name: '',
      description: '',
      course_id: '',
      design_config: {
        background_color: '#1e40af',
        text_color: '#ffffff',
        border_style: 'solid',
        icon: 'trophy'
      },
      requirements: {
        completion_percentage: 100,
        min_score: undefined,
        required_modules: []
      },
      is_active: true
    });
  };

  const BadgePreview = ({ template }: { template: BadgeTemplate }) => {
    const iconMap: Record<string, string> = {
      trophy: '🏆',
      medal: '🏅',
      star: '⭐',
      crown: '👑',
      gem: '💎',
      shield: '🛡️',
      target: '🎯',
      rocket: '🚀'
    };

    return (
      <div 
        className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 text-sm font-bold"
        style={{
          backgroundColor: template.design_config.background_color,
          color: template.design_config.text_color,
          borderStyle: template.design_config.border_style,
          borderColor: template.design_config.text_color
        }}
      >
        <span className="text-2xl">
          {iconMap[template.design_config.icon] || '🏆'}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Editor de Badges</CardTitle>
          <CardDescription>
            Crie e gerencie templates de badges que serão automaticamente concedidos aos alunos quando completarem cursos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Course Selection */}
          <div className="space-y-2">
            <Label htmlFor="course-select">Selecionar Curso</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um curso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCourse && (
            <>
              {/* Badge Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="badge-name">Nome do Badge</Label>
                    <Input
                      id="badge-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Especialista em Cibersegurança"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="badge-description">Descrição</Label>
                    <Textarea
                      id="badge-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição do badge..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="completion-percentage">Porcentagem de Conclusão Necessária (%)</Label>
                    <Input
                      id="completion-percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.requirements.completion_percentage}
                      onChange={(e) => setFormData({
                        ...formData,
                        requirements: {
                          ...formData.requirements,
                          completion_percentage: parseInt(e.target.value) || 0
                        }
                      })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is-active">Badge Ativo</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Design do Badge</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="background-color">Cor de Fundo</Label>
                    <Input
                      id="background-color"
                      type="color"
                      value={formData.design_config.background_color}
                      onChange={(e) => setFormData({
                        ...formData,
                        design_config: {
                          ...formData.design_config,
                          background_color: e.target.value
                        }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text-color">Cor do Texto</Label>
                    <Input
                      id="text-color"
                      type="color"
                      value={formData.design_config.text_color}
                      onChange={(e) => setFormData({
                        ...formData,
                        design_config: {
                          ...formData.design_config,
                          text_color: e.target.value
                        }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon-select">Ícone</Label>
                    <Select 
                      value={formData.design_config.icon} 
                      onValueChange={(value) => setFormData({
                        ...formData,
                        design_config: {
                          ...formData.design_config,
                          icon: value
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((icon) => (
                          <SelectItem key={icon.value} value={icon.value}>
                            {icon.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="border-style">Estilo da Borda</Label>
                    <Select 
                      value={formData.design_config.border_style} 
                      onValueChange={(value) => setFormData({
                        ...formData,
                        design_config: {
                          ...formData.design_config,
                          border_style: value
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BORDER_STYLES.map((style) => (
                          <SelectItem key={style.value} value={style.value}>
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="flex items-center justify-center p-4 border rounded-lg bg-gray-50">
                      <BadgePreview template={formData} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingBadge ? 'Atualizar' : 'Criar'} Badge
                </Button>
                {editingBadge && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
              </div>

              {/* Existing Badge Templates */}
              {badgeTemplates.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Templates Existentes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {badgeTemplates.map((badge) => (
                      <Card key={badge.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <BadgePreview template={badge} />
                            <div className="min-w-0">
                              <h5 className="font-medium truncate">{badge.name}</h5>
                              <p className="text-sm text-muted-foreground truncate">
                                {badge.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(badge)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(badge.id!)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Conclusão: {badge.requirements.completion_percentage}%</span>
                          <Badge variant={badge.is_active ? 'default' : 'secondary'}>
                            {badge.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}