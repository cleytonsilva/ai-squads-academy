'use client';

import React, { useState, useRef, useEffect } from 'react';
import TiptapAdminEditor from '@/components/ui/tiptap/tiptap-admin-editor';
import { Module } from '@/types/course';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Save,
  Eye,
  EyeOff,
  Settings,
  FileText,
  Image,
  Video,
  Link,
  Code,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ModuleEditorProps {
  module: Module;
  courseId: string;
  onSave?: (updatedModule: Module) => void;
  onCancel?: () => void;
}

interface ModuleFormData {
  title: string;
  description: string;
  module_type: 'lesson' | 'exercise' | 'quiz' | 'project';
  content: string;
  estimated_duration: number;
  order_index: number;
}

export default function ModuleEditor({ module, courseId, onSave, onCancel }: ModuleEditorProps) {
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  
  const [formData, setFormData] = useState<ModuleFormData>({
    title: module.title || '',
    description: module.description || '',
    module_type: module.module_type || 'lesson',
    content: module.content_jsonb?.content || '',
    estimated_duration: module.estimated_duration || 15,
    order_index: module.order_index || 0
  });

  // Ref para o editor Tiptap
  const tiptapRef = useRef<any>(null);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Obter conteúdo do editor Tiptap
      const content = tiptapRef.current?.getHTML() || formData.content;

      // Prepare update data
      const updateData = {
        title: formData.title,
        description: formData.description,
        module_type: formData.module_type,
        estimated_duration: formData.estimated_duration,
        order_index: formData.order_index,
        content_jsonb: {
          content,
          summary: formData.description,
          word_count: content.replace(/<[^>]*>/g, '').split(/\s+/).length,
          last_edited: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      };

      // Update module in database
      const { data, error } = await supabase
        .from('course_modules')
        .update(updateData)
        .eq('id', module.id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Módulo salvo com sucesso!');
      
      // Call onSave callback with updated module
      if (onSave && data) {
        onSave(data);
      }
    } catch (error: any) {
      console.error('Erro ao salvar módulo:', error);
      toast.error('Erro ao salvar módulo: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ModuleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getModuleTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <FileText className="w-4 h-4" />;
      case 'exercise': return <Code className="w-4 h-4" />;
      case 'quiz': return <Settings className="w-4 h-4" />;
      case 'project': return <Image className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getModuleTypeColor = (type: string) => {
    switch (type) {
      case 'lesson': return 'bg-blue-100 text-blue-800';
      case 'exercise': return 'bg-green-100 text-green-800';
      case 'quiz': return 'bg-yellow-100 text-yellow-800';
      case 'project': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {getModuleTypeIcon(formData.module_type)}
              <h1 className="text-2xl font-bold text-gray-900">
                Editando: {formData.title || 'Novo Módulo'}
              </h1>
            </div>
            <Badge className={getModuleTypeColor(formData.module_type)}>
              {formData.module_type}
            </Badge>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Editar
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar
                </>
              )}
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="bg-white border-b border-gray-200 px-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
              <TabsTrigger value="preview">Visualização</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="content" className="h-full m-0 p-6">
              {previewMode ? (
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Visualização do Conteúdo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: formData.content }}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full">
                  <TiptapAdminEditor
                    ref={tiptapRef}
                    content={formData.content}
                    onChange={(content) => handleInputChange('content', content)}
                    courseId={courseId}
                    placeholder="Digite o conteúdo do módulo..."
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="m-0 p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título do Módulo</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Digite o título do módulo"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Descreva o que será abordado neste módulo"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="module_type">Tipo do Módulo</Label>
                        <Select
                          value={formData.module_type}
                          onValueChange={(value: any) => handleInputChange('module_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lesson">Aula</SelectItem>
                            <SelectItem value="exercise">Exercício</SelectItem>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="project">Projeto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="duration">Duração (minutos)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={formData.estimated_duration}
                          onChange={(e) => handleInputChange('estimated_duration', parseInt(e.target.value) || 0)}
                          min="1"
                          max="180"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="order">Ordem no Curso</Label>
                      <Input
                        id="order"
                        type="number"
                        value={formData.order_index}
                        onChange={(e) => handleInputChange('order_index', parseInt(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Estatísticas do Conteúdo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Palavras</p>
                        <p className="font-semibold">
                          {formData.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Caracteres</p>
                        <p className="font-semibold">
                          {formData.content.replace(/<[^>]*>/g, '').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="m-0 p-6">
              <div className="max-w-4xl mx-auto">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          {getModuleTypeIcon(formData.module_type)}
                          <span>{formData.title}</span>
                        </CardTitle>
                        <p className="text-gray-600 mt-2">{formData.description}</p>
                      </div>
                      <Badge className={getModuleTypeColor(formData.module_type)}>
                        {formData.module_type}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Video className="w-4 h-4" />
                        <span>{formData.estimated_duration} min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>
                          {formData.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length} palavras
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: formData.content }}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}