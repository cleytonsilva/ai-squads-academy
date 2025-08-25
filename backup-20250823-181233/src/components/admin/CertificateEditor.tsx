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
import { Trash2, Plus, Save, Eye, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
}

interface CertificateTemplate {
  id?: string;
  name: string;
  description: string;
  course_id: string;
  design_config: {
    background_color: string;
    text_color: string;
    border_style: string;
    font_family: string;
    logo_position: string;
    signature_line: boolean;
  };
  content_config: {
    title: string;
    subtitle: string;
    body_text: string;
    footer_text: string;
  };
  requirements: {
    completion_percentage: number;
    min_score?: number;
    required_modules: string[];
  };
  is_active: boolean;
}

const FONT_FAMILIES = [
  { value: 'serif', label: 'Serif (Times New Roman)' },
  { value: 'sans-serif', label: 'Sans-serif (Arial)' },
  { value: 'monospace', label: 'Monospace (Courier)' },
  { value: 'cursive', label: 'Cursive (Script)' },
  { value: 'fantasy', label: 'Fantasy (Decorativa)' }
];

const LOGO_POSITIONS = [
  { value: 'top-left', label: 'Superior Esquerdo' },
  { value: 'top-center', label: 'Superior Centro' },
  { value: 'top-right', label: 'Superior Direito' },
  { value: 'center', label: 'Centro' },
  { value: 'bottom-center', label: 'Inferior Centro' }
];

const BORDER_STYLES = [
  { value: 'solid', label: 'Sólida' },
  { value: 'dashed', label: 'Tracejada' },
  { value: 'dotted', label: 'Pontilhada' },
  { value: 'double', label: 'Dupla' },
  { value: 'none', label: 'Sem borda' }
];

export default function CertificateEditor() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCertificate, setEditingCertificate] = useState<CertificateTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CertificateTemplate>({
    name: '',
    description: '',
    course_id: '',
    design_config: {
      background_color: '#ffffff',
      text_color: '#000000',
      border_style: 'solid',
      font_family: 'serif',
      logo_position: 'top-center',
      signature_line: true
    },
    content_config: {
      title: 'Certificado de Conclusão',
      subtitle: 'Este certificado atesta que',
      body_text: 'concluiu com sucesso o curso {{course_title}} com aproveitamento de {{final_score}}%',
      footer_text: 'Emitido em {{issue_date}} • Esquads Academy'
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

  // Load certificate templates when course is selected
  useEffect(() => {
    if (selectedCourse) {
      loadCertificateTemplates();
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
      toast.error('Não foi possível carregar os cursos');
    }
  };

  const loadCertificateTemplates = async () => {
    if (!selectedCourse) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('course_id', selectedCourse)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertificateTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates de certificado:', error);
      toast.error('Não foi possível carregar os templates de certificado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !selectedCourse) {
      toast.error('Nome e curso são obrigatórios');
      return;
    }

    try {
      setIsSaving(true);
      const dataToSave = {
        ...formData,
        course_id: selectedCourse
      };

      if (editingCertificate?.id) {
        // Update existing certificate template
        const { error } = await supabase
          .from('certificate_templates')
          .update(dataToSave)
          .eq('id', editingCertificate.id);

        if (error) throw error;
        toast.success('Template de certificado atualizado com sucesso');
      } else {
        // Create new certificate template
        const { error } = await supabase
          .from('certificate_templates')
          .insert([dataToSave]);

        if (error) throw error;
        toast.success('Template de certificado criado com sucesso');
      }

      // Reset form and reload templates
      resetForm();
      loadCertificateTemplates();
    } catch (error) {
      console.error('Erro ao salvar template de certificado:', error);
      toast.error('Não foi possível salvar o template de certificado');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template de certificado?')) {
      return;
    }

    try {
      setDeletingId(id);
      const { error } = await supabase
        .from('certificate_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Template de certificado excluído com sucesso');
      
      loadCertificateTemplates();
    } catch (error) {
      console.error('Erro ao excluir template de certificado:', error);
      toast.error('Não foi possível excluir o template de certificado');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (certificate: CertificateTemplate) => {
    setEditingCertificate(certificate);
    setFormData(certificate);
  };

  const resetForm = () => {
    setEditingCertificate(null);
    setFormData({
      name: '',
      description: '',
      course_id: '',
      design_config: {
        background_color: '#ffffff',
        text_color: '#000000',
        border_style: 'solid',
        font_family: 'serif',
        logo_position: 'top-center',
        signature_line: true
      },
      content_config: {
        title: 'Certificado de Conclusão',
        subtitle: 'Este certificado atesta que',
        body_text: 'concluiu com sucesso o curso {{course_title}} com aproveitamento de {{final_score}}%',
        footer_text: 'Emitido em {{issue_date}} • Esquads Academy'
      },
      requirements: {
        completion_percentage: 100,
        min_score: undefined,
        required_modules: []
      },
      is_active: true
    });
  };

  const CertificatePreview = ({ template }: { template: CertificateTemplate }) => {
    const selectedCourseData = courses.find(c => c.id === selectedCourse);
    
    return (
      <div 
        className="w-full max-w-md mx-auto p-6 border-4 bg-white text-center"
        style={{
          backgroundColor: template.design_config.background_color,
          color: template.design_config.text_color,
          borderStyle: template.design_config.border_style,
          borderColor: template.design_config.text_color,
          fontFamily: template.design_config.font_family,
          minHeight: '300px'
        }}
      >
        {/* Logo placeholder */}
        {template.design_config.logo_position === 'top-center' && (
          <div className="mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-white font-bold">
              E
            </div>
          </div>
        )}
        
        {/* Title */}
        <h1 className="text-2xl font-bold mb-2">{template.content_config.title}</h1>
        
        {/* Subtitle */}
        <p className="text-lg mb-4">{template.content_config.subtitle}</p>
        
        {/* Student name placeholder */}
        <p className="text-xl font-semibold mb-4 border-b-2 border-current inline-block px-4 py-1">
          [Nome do Aluno]
        </p>
        
        {/* Body text */}
        <p className="text-base mb-6">
          {template.content_config.body_text
            .replace('{{course_title}}', selectedCourseData?.title || '[Título do Curso]')
            .replace('{{final_score}}', '95')}
        </p>
        
        {/* Signature line */}
        {template.design_config.signature_line && (
          <div className="mb-4">
            <div className="border-t-2 border-current w-48 mx-auto mb-2"></div>
            <p className="text-sm">Assinatura do Instrutor</p>
          </div>
        )}
        
        {/* Footer */}
        <p className="text-sm">
          {template.content_config.footer_text
            .replace('{{issue_date}}', new Date().toLocaleDateString('pt-BR'))}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Editor de Certificados</CardTitle>
          <CardDescription>
            Crie e gerencie templates de certificados que serão automaticamente emitidos aos alunos quando completarem cursos.
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
              {/* Certificate Form */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="font-medium">Informações Básicas</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="certificate-name">Nome do Template</Label>
                    <Input
                      id="certificate-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Certificado Padrão"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certificate-description">Descrição</Label>
                    <Textarea
                      id="certificate-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição do template..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="completion-percentage">Porcentagem de Conclusão (%)</Label>
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
                    <Label htmlFor="is-active">Template Ativo</Label>
                  </div>
                </div>

                {/* Design Config */}
                <div className="space-y-4">
                  <h4 className="font-medium">Design</h4>
                  
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
                    <Label htmlFor="font-family">Fonte</Label>
                    <Select 
                      value={formData.design_config.font_family} 
                      onValueChange={(value) => setFormData({
                        ...formData,
                        design_config: {
                          ...formData.design_config,
                          font_family: value
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
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

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="signature-line"
                      checked={formData.design_config.signature_line}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        design_config: {
                          ...formData.design_config,
                          signature_line: checked
                        }
                      })}
                    />
                    <Label htmlFor="signature-line">Linha de Assinatura</Label>
                  </div>
                </div>

                {/* Content Template */}
                <div className="space-y-4">
                  <h4 className="font-medium">Conteúdo</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={formData.content_config.title}
                      onChange={(e) => setFormData({
                        ...formData,
                        content_config: {
                          ...formData.content_config,
                          title: e.target.value
                        }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtítulo</Label>
                    <Input
                      id="subtitle"
                      value={formData.content_config.subtitle}
                      onChange={(e) => setFormData({
                        ...formData,
                        content_config: {
                          ...formData.content_config,
                          subtitle: e.target.value
                        }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body-text">Texto Principal</Label>
                    <Textarea
                      id="body-text"
                      value={formData.content_config.body_text}
                      onChange={(e) => setFormData({
                        ...formData,
                        content_config: {
                          ...formData.content_config,
                          body_text: e.target.value
                        }
                      })}
                      rows={3}
                      placeholder="Use {{course_title}} e {{final_score}} como variáveis"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footer-text">Rodapé</Label>
                    <Input
                      id="footer-text"
                      value={formData.content_config.footer_text}
                      onChange={(e) => setFormData({
                        ...formData,
                        content_config: {
                          ...formData.content_config,
                          footer_text: e.target.value
                        }
                      })}
                      placeholder="Use {{issue_date}} como variável"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              {selectedCourse && (
                <div className="space-y-4">
                  <h4 className="font-medium">Preview do Certificado</h4>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <CertificatePreview template={formData} />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSaving ? 'Salvando...' : (editingCertificate ? 'Atualizar' : 'Criar')} Template
                </Button>
                {editingCertificate && (
                  <Button variant="outline" onClick={resetForm} disabled={isSaving}>
                    Cancelar
                  </Button>
                )}
              </div>

              {/* Existing Certificate Templates */}
              {certificateTemplates.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Templates Existentes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certificateTemplates.map((certificate) => (
                      <Card key={certificate.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="min-w-0 flex-1">
                            <h5 className="font-medium truncate">{certificate.name}</h5>
                            <p className="text-sm text-muted-foreground truncate">
                              {certificate.description}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(certificate)}
                              disabled={isSaving || deletingId === certificate.id}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(certificate.id!)}
                              disabled={deletingId === certificate.id || isSaving}
                            >
                              {deletingId === certificate.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Conclusão: {certificate.requirements.completion_percentage}%</span>
                          <Badge variant={certificate.is_active ? 'default' : 'secondary'}>
                            {certificate.is_active ? 'Ativo' : 'Inativo'}
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