import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Award, Plus, Edit, Trash2, Eye, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// Interfaces para tipagem
interface BadgeTemplate {
  id: string;
  name: string; // Campo correto da tabela badges
  description: string | null;
  image_url: string | null; // Campo correto para imagem
  key: string | null; // Campo adicional da tabela badges
  style: any; // Campo JSON da tabela badges
  category?: string;
  is_active?: boolean;
  color?: string;
  criteria?: string;
  course_id?: string;
  created_at: string;
  updated_at: string;
}

interface CertificateTemplate {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  background_color: string;
  text_color: string;
  font_family: string;
  border_style: string;
  signature_line: boolean;
  main_text: string;
  footer_text: string;
  course_id: string;
  created_at: string;
  updated_at: string;
  course?: {
    title: string;
  };
}

interface Course {
  id: string;
  title: string;
}

export default function TemplateManagement() {
  const { user } = useAuth();
  const [badgeTemplates, setBadgeTemplates] = useState<BadgeTemplate[]>([]);
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBadge, setEditingBadge] = useState<BadgeTemplate | null>(null);
  const [editingCertificate, setEditingCertificate] = useState<CertificateTemplate | null>(null);
  const [showBadgeDialog, setShowBadgeDialog] = useState(false);
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState<CertificateTemplate | null>(null);

  // Estados para formulários
  const [badgeForm, setBadgeForm] = useState({
    name: '',
    description: '',
    image_url: '',
    style: { icon: 'award', color: '#3B82F6' },
    key: '',
  });

  const [certificateForm, setCertificateForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    background_color: '#FFFFFF',
    text_color: '#000000',
    font_family: 'serif',
    border_style: 'solid',
    signature_line: true,
    main_text: 'Certificamos que {user_name} concluiu com sucesso o curso {course_title} em {issue_date}.',
    footer_text: 'Este certificado é válido e pode ser verificado em nossa plataforma.',
    course_id: '',
  });

  /**
   * Carrega dados iniciais
   */
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar templates de badges (agora na tabela badges)
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select(`*`)
        .order('created_at', { ascending: false });

      if (badgesError) throw badgesError;

      // Carregar templates de certificados
      const { data: certificates, error: certificatesError } = await supabase
        .from('certificate_templates')
        .select(`
          *,
          course:courses(title)
        `)
        .order('created_at', { ascending: false });

      if (certificatesError) throw certificatesError;

      // Carregar cursos
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .order('title');

      if (coursesError) throw coursesError;

      setBadgeTemplates(badges || []);
      setCertificateTemplates(certificates || []);
      setCourses(coursesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Salva template de badge
   */
  const saveBadgeTemplate = async () => {
    try {
      const data = {
        ...badgeForm,
      };

      if (editingBadge) {
        // Atualizar
        const { error } = await supabase
          .from('badges')
          .update(data)
          .eq('id', editingBadge.id);

        if (error) throw error;
        toast.success('Template de badge atualizado!');
      } else {
        // Criar
        const { error } = await supabase
          .from('badges')
          .insert([data]);

        if (error) throw error;
        toast.success('Template de badge criado!');
      }

      setShowBadgeDialog(false);
      setEditingBadge(null);
      resetBadgeForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar template de badge:', error);
      toast.error('Erro ao salvar template de badge');
    }
  };

  /**
   * Salva template de certificado
   */
  const saveCertificateTemplate = async () => {
    try {
      if (editingCertificate) {
        // Atualizar
        const { error } = await supabase
          .from('certificate_templates')
          .update(certificateForm)
          .eq('id', editingCertificate.id);

        if (error) throw error;
        toast.success('Template de certificado atualizado!');
      } else {
        // Criar
        const { error } = await supabase
          .from('certificate_templates')
          .insert([certificateForm]);

        if (error) throw error;
        toast.success('Template de certificado criado!');
      }

      setShowCertificateDialog(false);
      setEditingCertificate(null);
      resetCertificateForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar template de certificado:', error);
      toast.error('Erro ao salvar template de certificado');
    }
  };

  /**
   * Deleta template de badge
   */
  const deleteBadgeTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template de badge?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Template de badge excluído!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir template de badge:', error);
      toast.error('Erro ao excluir template de badge');
    }
  };

  /**
   * Deleta template de certificado
   */
  const deleteCertificateTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template de certificado?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('certificate_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Template de certificado excluído!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir template de certificado:', error);
      toast.error('Erro ao excluir template de certificado');
    }
  };

  /**
   * Inicia edição de badge
   */
  const startEditBadge = (badge: BadgeTemplate) => {
    setEditingBadge(badge);
    setBadgeForm({
      name: badge.name,
      description: badge.description || '',
      image_url: badge.image_url || '',
      style: badge.style || { icon: 'award', color: '#3B82F6' },
      key: badge.key || '',
    });
    setShowBadgeDialog(true);
  };

  /**
   * Inicia edição de certificado
   */
  const startEditCertificate = (certificate: CertificateTemplate) => {
    setEditingCertificate(certificate);
    setCertificateForm({
      title: certificate.title,
      subtitle: certificate.subtitle,
      description: certificate.description,
      background_color: certificate.background_color,
      text_color: certificate.text_color,
      font_family: certificate.font_family,
      border_style: certificate.border_style,
      signature_line: certificate.signature_line,
      main_text: certificate.main_text,
      footer_text: certificate.footer_text,
      course_id: certificate.course_id,
    });
    setShowCertificateDialog(true);
  };

  /**
   * Reseta formulário de badge
   */
  const resetBadgeForm = () => {
    setBadgeForm({
      name: '',
      description: '',
      image_url: '',
      style: { icon: 'award', color: '#3B82F6' },
      key: '',
    });
  };

  /**
   * Reseta formulário de certificado
   */
  const resetCertificateForm = () => {
    setCertificateForm({
      title: '',
      subtitle: '',
      description: '',
      background_color: '#FFFFFF',
      text_color: '#000000',
      font_family: 'serif',
      border_style: 'solid',
      signature_line: true,
      main_text: 'Certificamos que {user_name} concluiu com sucesso o curso {course_title} em {issue_date}.',
      footer_text: 'Este certificado é válido e pode ser verificado em nossa plataforma.',
      course_id: '',
    });
  };

  /**
   * Abre dialog para novo badge
   */
  const openNewBadgeDialog = () => {
    setEditingBadge(null);
    resetBadgeForm();
    setShowBadgeDialog(true);
  };

  /**
   * Abre dialog para novo certificado
   */
  const openNewCertificateDialog = () => {
    setEditingCertificate(null);
    resetCertificateForm();
    setShowCertificateDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Carregando templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Templates</h2>
          <p className="text-muted-foreground">
            Crie e gerencie templates de badges e certificados
          </p>
        </div>
      </div>

      <Tabs defaultValue="badges" className="space-y-4">
        <TabsList>
          <TabsTrigger value="badges">Templates de Badges</TabsTrigger>
          <TabsTrigger value="certificates">Templates de Certificados</TabsTrigger>
        </TabsList>

        {/* Templates de Badges */}
        <TabsContent value="badges" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Templates de Badges</h3>
            <Button onClick={openNewBadgeDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Badge
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badgeTemplates.map((badge) => (
              <Card key={badge.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5" style={{ color: badge.style?.color || '#3B82F6' }} />
                    <CardTitle className="text-sm">{badge.name}</CardTitle>
                  </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditBadge(badge)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBadgeTemplate(badge.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">
                    {badge.description}
                  </p>
                  <div className="space-y-1 text-xs">
                    <p><strong>Chave:</strong> {badge.key}</p>
                    {badge.image_url && (
                      <p><strong>Imagem:</strong> Configurada</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Templates de Certificados */}
        <TabsContent value="certificates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Templates de Certificados</h3>
            <Button onClick={openNewCertificateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Certificado
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificateTemplates.map((certificate) => (
              <Card key={certificate.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award className="h-5 w-5" />
                      <CardTitle className="text-sm">{certificate.title}</CardTitle>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewCertificate(certificate)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditCertificate(certificate)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCertificateTemplate(certificate.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">
                    {certificate.description}
                  </p>
                  <div className="space-y-1 text-xs">
                    <p><strong>Subtítulo:</strong> {certificate.subtitle}</p>
                    <p><strong>Fonte:</strong> {certificate.font_family}</p>
                    {certificate.course && (
                      <p><strong>Curso:</strong> {certificate.course.title}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para Badge */}
      <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBadge ? 'Editar Template de Badge' : 'Novo Template de Badge'}
            </DialogTitle>
            <DialogDescription>
              Configure as propriedades do template de badge
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="badge-name">Nome</Label>
              <Input
                id="badge-name"
                value={badgeForm.name}
                onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
                placeholder="Nome do badge"
              />
            </div>

            <div>
              <Label htmlFor="badge-description">Descrição</Label>
              <Textarea
                id="badge-description"
                value={badgeForm.description}
                onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                placeholder="Descrição do badge"
              />
            </div>

            <div>
              <Label htmlFor="badge-key">Chave</Label>
              <Input
                id="badge-key"
                value={badgeForm.key}
                onChange={(e) => setBadgeForm({ ...badgeForm, key: e.target.value })}
                placeholder="Chave única do badge"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="badge-image">URL da Imagem</Label>
                <Input
                  id="badge-image"
                  value={badgeForm.image_url}
                  onChange={(e) => setBadgeForm({ ...badgeForm, image_url: e.target.value })}
                  placeholder="URL da imagem do badge"
                />
              </div>

              <div>
                <Label htmlFor="badge-color">Cor</Label>
                <Input
                  id="badge-color"
                  type="color"
                  value={badgeForm.style?.color || '#3B82F6'}
                  onChange={(e) => setBadgeForm({ ...badgeForm, style: { ...badgeForm.style, color: e.target.value } })}
                />
              </div>
            </div>



            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowBadgeDialog(false)}
              >
                Cancelar
              </Button>
              <Button onClick={saveBadgeTemplate}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para Certificado */}
      <Dialog open={showCertificateDialog} onOpenChange={setShowCertificateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCertificate ? 'Editar Template de Certificado' : 'Novo Template de Certificado'}
            </DialogTitle>
            <DialogDescription>
              Configure as propriedades do template de certificado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cert-title">Título</Label>
                <Input
                  id="cert-title"
                  value={certificateForm.title}
                  onChange={(e) => setCertificateForm({ ...certificateForm, title: e.target.value })}
                  placeholder="Certificado de Conclusão"
                />
              </div>

              <div>
                <Label htmlFor="cert-subtitle">Subtítulo</Label>
                <Input
                  id="cert-subtitle"
                  value={certificateForm.subtitle}
                  onChange={(e) => setCertificateForm({ ...certificateForm, subtitle: e.target.value })}
                  placeholder="Curso Online"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cert-description">Descrição</Label>
              <Textarea
                id="cert-description"
                value={certificateForm.description}
                onChange={(e) => setCertificateForm({ ...certificateForm, description: e.target.value })}
                placeholder="Descrição do certificado"
              />
            </div>

            <div>
              <Label htmlFor="cert-course">Curso</Label>
              <Select
                value={certificateForm.course_id}
                onValueChange={(value) => setCertificateForm({ ...certificateForm, course_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um curso" />
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

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cert-bg-color">Cor de Fundo</Label>
                <Input
                  id="cert-bg-color"
                  type="color"
                  value={certificateForm.background_color}
                  onChange={(e) => setCertificateForm({ ...certificateForm, background_color: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="cert-text-color">Cor do Texto</Label>
                <Input
                  id="cert-text-color"
                  type="color"
                  value={certificateForm.text_color}
                  onChange={(e) => setCertificateForm({ ...certificateForm, text_color: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="cert-font">Fonte</Label>
                <Select
                  value={certificateForm.font_family}
                  onValueChange={(value) => setCertificateForm({ ...certificateForm, font_family: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="sans-serif">Sans Serif</SelectItem>
                    <SelectItem value="monospace">Monospace</SelectItem>
                    <SelectItem value="cursive">Cursive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="cert-main-text">Texto Principal</Label>
              <Textarea
                id="cert-main-text"
                value={certificateForm.main_text}
                onChange={(e) => setCertificateForm({ ...certificateForm, main_text: e.target.value })}
                placeholder="Use {user_name}, {course_title}, {issue_date}"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="cert-footer-text">Texto do Rodapé</Label>
              <Textarea
                id="cert-footer-text"
                value={certificateForm.footer_text}
                onChange={(e) => setCertificateForm({ ...certificateForm, footer_text: e.target.value })}
                placeholder="Informações adicionais"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="cert-signature"
                checked={certificateForm.signature_line}
                onCheckedChange={(checked) => setCertificateForm({ ...certificateForm, signature_line: checked })}
              />
              <Label htmlFor="cert-signature">Incluir linha de assinatura</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCertificateDialog(false)}
              >
                Cancelar
              </Button>
              <Button onClick={saveCertificateTemplate}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Preview do Certificado */}
      <Dialog open={!!previewCertificate} onOpenChange={() => setPreviewCertificate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview do Certificado</DialogTitle>
            <DialogDescription>
              Visualização do template de certificado
            </DialogDescription>
          </DialogHeader>

          {previewCertificate && (
            <div 
              className="border-8 p-12 text-center min-h-[400px] flex flex-col justify-center"
              style={{
                backgroundColor: previewCertificate.background_color,
                color: previewCertificate.text_color,
                fontFamily: previewCertificate.font_family,
                borderStyle: previewCertificate.border_style,
                borderColor: previewCertificate.text_color,
              }}
            >
              <h1 className="text-4xl font-bold mb-4 uppercase tracking-wider">
                {previewCertificate.title}
              </h1>
              
              {previewCertificate.subtitle && (
                <h2 className="text-xl mb-8 italic">
                  {previewCertificate.subtitle}
                </h2>
              )}
              
              <div className="text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                {previewCertificate.main_text
                  .replace('{user_name}', 'João Silva')
                  .replace('{course_title}', previewCertificate.course?.title || 'Curso Exemplo')
                  .replace('{issue_date}', new Date().toLocaleDateString('pt-BR'))
                }
              </div>
              
              <div className="text-base mb-8">
                <strong>Curso:</strong> {previewCertificate.course?.title || 'Curso Exemplo'}
              </div>
              
              <div className="text-sm mb-8">
                Emitido em {new Date().toLocaleDateString('pt-BR')}
              </div>
              
              {previewCertificate.signature_line && (
                <div className="w-64 mx-auto border-t-2 pt-2 text-sm" style={{ borderColor: previewCertificate.text_color }}>
                  Assinatura Digital Verificada
                </div>
              )}
              
              {previewCertificate.footer_text && (
                <div className="text-xs mt-8 opacity-80 max-w-2xl mx-auto">
                  {previewCertificate.footer_text}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}