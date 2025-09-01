import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import TiptapAdminEditor from '@/components/ui/tiptap/tiptap-admin-editor';

import { supabase } from "@/integrations/supabase/client";
import { supabaseModuleRetry } from "@/utils/supabaseWithRetry";
import { useDebounce, useModuleSaveDebounce } from "@/hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import QuizManager from "@/components/admin/QuizManager";
import MissionManager from "@/components/admin/MissionManager";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { ImageIcon } from "lucide-react";
import AIGenerationDialog from "@/components/admin/AIGenerationDialog";
import AIModuleExtendDialog from "@/components/admin/AIModuleExtendDialog";
import DashboardLayout from "@/components/admin/DashboardLayout";
import CourseCoverManager from "@/components/admin/CourseCoverManager";
import { useRealtimeCourseUpdates } from "@/hooks/useRealtimeCourseUpdates";

interface Course {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  status: string;
  cover_image_url: string | null;
}

interface ModuleRow {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  content_jsonb: any | null;
}

export default function AdminCourseEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const getHtml = (payload: unknown): string => {
    try {
      if (payload && typeof payload === "object" && payload !== null && "html" in (payload as any)) {
        return (payload as any).html || "";
      }
      return typeof payload === "string" ? (payload as string) : "";
    } catch {
      return "";
    }
  };
  
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [status, setStatus] = useState("draft");
  const [deleting, setDeleting] = useState(false);
  const [switchingModule, setSwitchingModule] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleHtml, setModuleHtml] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Ref para o editor Tiptap
  const tiptapRef = useRef<any>(null);

  const canonical = useMemo(() => {
    try { return window.location.href } catch { return `/admin/courses/${id}` }
  }, [id]);

  const isNewCourse = !id;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-course-editor", id],
    enabled: !!id,
    queryFn: async () => {
      const [{ data: course, error: cErr }, { data: modules, error: mErr }] = await Promise.all([
        supabase.from("courses").select("id,title,description,is_published,status,cover_image_url").eq("id", id!).maybeSingle(),
        supabase.from("modules").select("id,course_id,title,order_index,content_jsonb").eq("course_id", id!).order("order_index", { ascending: true }),
      ]);
      if (cErr) throw cErr;
      if (mErr) throw mErr;
      return { course, modules } as { course: Course; modules: ModuleRow[] };
    },
  });

  const currentModule = data?.modules?.find((m) => m.id === selectedModuleId) || null;

  // Hook para atualizações em tempo real da capa do curso
  useRealtimeCourseUpdates({
    courseId: id,
    onCoverUpdated: (courseId, newImageUrl) => {
      console.log('[REALTIME] Capa atualizada para curso:', courseId, newImageUrl);
      refetch();
      toast({ title: "Sucesso", description: "Capa do curso atualizada automaticamente!" });
    }
  });

  // Função handleSaveModule melhorada com debounce e proteção contra race conditions
  const handleSaveModule = useCallback(async (force = false) => {
    if (!selectedModuleId || (isSaving && !force)) {
      console.warn('⚠️ Salvamento em andamento ou módulo não selecionado');
      return;
    }
    
    try {
      setIsSaving(true);
      
      const currentContent = tiptapRef.current?.getHTML() || moduleHtml;
      const trimmedTitle = moduleTitle.trim();
      
      // Validação básica
      if (!trimmedTitle) {
        toast({ title: "Erro", description: "Título do módulo não pode estar vazio", variant: "destructive" });
        return;
      }
      
      console.log('💾 Salvando módulo:', { 
        id: selectedModuleId, 
        title: trimmedTitle,
        contentLength: currentContent.length 
      });
      
      const updateData = {
        title: trimmedTitle,
        content_jsonb: { 
          html: currentContent,
          last_saved: new Date().toISOString(),
          word_count: currentContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length,
          version: Date.now() // Adicionar versionamento
        }
      };
      
      // Usar supabaseModuleRetry para melhor tratamento de erros
      const { error } = await supabaseModuleRetry(
        () => supabase
          .from("modules")
          .update(updateData)
          .eq("id", selectedModuleId),
        selectedModuleId,
        'update'
      );
        
      if (error) throw error;
      
      console.log('✅ Módulo salvo com sucesso');
      toast({ title: "Sucesso", description: "Módulo salvo" });
      
      // Atualizar estado local
      setHasUnsavedChanges(false);
      setModuleHtml(currentContent);
      
      // Refetch apenas se necessário
      if (force) {
        setTimeout(() => refetch(), 100);
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao salvar módulo:', error);
      toast({ title: "Erro", description: `Erro ao salvar módulo: ${error?.message || 'Erro desconhecido'}`, variant: "destructive" });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [selectedModuleId, moduleTitle, moduleHtml, isSaving]);
  
  // Debounced version para auto-save
  const { debouncedSave, forceSave } = useModuleSaveDebounce(handleSaveModule, 2000);
  
  // Função para detectar mudanças de forma robusta
  const detectChanges = useCallback(() => {
    if (!currentModule || switchingModule) return false;
    
    const originalContent = getHtml(currentModule.content_jsonb);
    const originalTitle = currentModule.title;
    
    const currentContent = tiptapRef.current?.getHTML() || moduleHtml;
    const currentTitle = moduleTitle.trim();
    
    // Normalizar conteúdo para comparação
    const normalizeContent = (content: string) => {
      return content
        .replace(/\s+/g, ' ')
        .replace(/><\//g, '></')
        .trim();
    };
    
    const hasContentChanges = normalizeContent(currentContent) !== normalizeContent(originalContent);
    const hasTitleChanges = currentTitle !== originalTitle;
    
    return hasContentChanges || hasTitleChanges;
  }, [currentModule, moduleHtml, moduleTitle, switchingModule]);

  const handleCreateCourse = async () => {
    if (!courseTitle.trim()) {
      toast({ title: "Erro", description: "Título do curso é obrigatório", variant: "destructive" });
      return;
    }

    try {
      setIsCreatingCourse(true);
      const { data: newCourse, error } = await supabase
        .from("courses")
        .insert({
          title: courseTitle,
          description: courseDesc || null,
          is_published: isPublished,
          status: status,
          difficulty_level: 'beginner',
          ai_generated: false
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Sucesso", description: "Curso criado com sucesso!" });
      navigate(`/admin/courses/${newCourse.id}/edit`);
    } catch (error: any) {
      toast({ title: "Erro", description: `Erro ao criar curso: ${error?.message}`, variant: "destructive" });
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const handleSaveCourse = async () => {
    if (isNewCourse) {
      await handleCreateCourse();
      return;
    }

    if (!id) return;
    const { error } = await supabase
      .from("courses")
      .update({ title: courseTitle, description: courseDesc, is_published: isPublished, status })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro", description: "Erro ao salvar curso", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Curso salvo" });
      refetch();
    }
  };

  const handleDeleteCourse = async () => {
    if (!id) return;
    try {
      setDeleting(true);
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Curso excluído" });
      navigate("/admin");
    } catch (e: any) {
      toast({ title: "Erro", description: `Erro ao excluir curso: ${e?.message}`, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectModule = async (m: ModuleRow) => {
    if (selectedModuleId === m.id) {
      console.log('🔄 Módulo já selecionado:', m.title);
      return;
    }

    try {
      setSwitchingModule(true);
      
      // Salvar mudanças pendentes antes de trocar
      if (hasUnsavedChanges && selectedModuleId) {
        console.log('💾 Salvando mudanças antes de trocar módulo...');
        await handleSaveModule();
      }
      
      console.log('📝 Trocando para módulo:', m.title, 'ID:', m.id);
      
      // Atualizar estado primeiro
      setSelectedModuleId(m.id);
      setModuleTitle(m.title);
      const newContent = getHtml(m.content_jsonb);
      setModuleHtml(newContent);
      
      console.log('📄 Conteúdo do módulo:', newContent.substring(0, 100) + '...');
      
      // Atualizar o editor Tiptap com delay para garantir que o estado foi atualizado
      if (tiptapRef.current && tiptapRef.current.setContent) {
        setTimeout(() => {
          try {
            tiptapRef.current?.setContent(newContent);
            console.log('✅ Editor Tiptap atualizado com sucesso');
          } catch (editorError) {
            console.warn('⚠️ Erro ao atualizar editor Tiptap:', editorError);
          }
        }, 150);
      }
      
      // Resetar flag de mudanças não salvas
      setHasUnsavedChanges(false);
      
    } catch (error) {
      console.error('❌ Erro ao trocar módulo:', error);
      toast({ title: "Erro", description: "Erro ao trocar módulo", variant: "destructive" });
    } finally {
      setSwitchingModule(false);
    }
  };

  const handleAddModule = async () => {
    if (!id) {
      console.warn('⚠️ ID do curso não encontrado');
      return;
    }
    
    try {
      // Salvar mudanças pendentes antes de criar novo módulo
      if (hasUnsavedChanges && selectedModuleId) {
        console.log('💾 Salvando mudanças antes de criar novo módulo...');
        await handleSaveModule();
      }
      
      const lastIndex = (data?.modules?.[data.modules.length - 1]?.order_index ?? -1) + 1;
      console.log('➕ Criando novo módulo com order_index:', lastIndex);
      
      const { data: inserted, error } = await supabase
        .from("modules")
        .insert({ 
          course_id: id, 
          title: "Novo módulo", 
          order_index: lastIndex, 
          content_jsonb: { html: "<p>Digite o conteúdo do módulo...</p>" } 
        })
        .select("id,title,order_index,content_jsonb")
        .maybeSingle();
        
      if (error) {
        console.error('❌ Erro ao criar módulo:', error);
        toast({ title: "Erro", description: `Erro ao criar módulo: ${error.message}`, variant: "destructive" });
        return;
      }
      
      if (inserted) {
        console.log('✅ Módulo criado:', inserted.title, 'ID:', inserted.id);
        toast({ title: "Sucesso", description: "Módulo criado com sucesso" });
        
        // Atualizar estado para o novo módulo
        setSelectedModuleId(inserted.id);
        setModuleTitle(inserted.title);
        const newContent = getHtml(inserted.content_jsonb);
        setModuleHtml(newContent);
        
        // Atualizar editor
        if (tiptapRef.current && tiptapRef.current.setContent) {
          setTimeout(() => {
            try {
              tiptapRef.current?.setContent(newContent);
              console.log('✅ Editor atualizado com conteúdo do novo módulo');
            } catch (error) {
              console.warn('⚠️ Erro ao atualizar editor:', error);
            }
          }, 100);
        }
        
        setHasUnsavedChanges(false);
        refetch();
      }
    } catch (error) {
      console.error('❌ Erro ao criar módulo:', error);
      toast({ title: "Erro", description: "Erro ao criar módulo", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (data?.course) {
      setCourseTitle(data.course.title);
      setCourseDesc(data.course.description || "");
      setIsPublished(!!data.course.is_published);
      setStatus(data.course.status || "draft");
    }
  }, [data?.course]);

  useEffect(() => {
    if (data?.modules && data.modules.length > 0 && !selectedModuleId) {
      const first = data.modules[0];
      console.log('🎯 Selecionando primeiro módulo:', first.title);
      setSelectedModuleId(first.id);
      setModuleTitle(first.title);
      const content = getHtml(first.content_jsonb);
      setModuleHtml(content);
      
      // Atualizar o editor Tiptap com o conteúdo correto
      if (tiptapRef.current && tiptapRef.current.setContent) {
        setTimeout(() => {
          try {
            tiptapRef.current?.setContent(content);
            console.log('✅ Editor atualizado com conteúdo do primeiro módulo');
          } catch (error) {
            console.warn('⚠️ Erro ao atualizar editor:', error);
          }
        }, 100);
      }
    }
  }, [data?.modules, selectedModuleId]);
  
  useEffect(() => {
    if (currentModule && !switchingModule && selectedModuleId === currentModule.id) {
      const originalContent = getHtml(currentModule.content_jsonb);
      const originalTitle = currentModule.title;
      
      // Usar o conteúdo do editor se disponível, senão usar o estado local
      const currentContent = tiptapRef.current?.getHTML() || moduleHtml;
      
      const hasContentChanges = currentContent.trim() !== originalContent.trim();
      const hasTitleChanges = moduleTitle.trim() !== originalTitle.trim();
      
      const hasChanges = hasContentChanges || hasTitleChanges;
      
      if (hasChanges !== hasUnsavedChanges) {
        console.log('🔄 Mudanças detectadas:', { hasContentChanges, hasTitleChanges, moduleTitle: moduleTitle.trim(), originalTitle });
        setHasUnsavedChanges(hasChanges);
      }
    } else if (!currentModule || switchingModule) {
      setHasUnsavedChanges(false);
    }
  }, [moduleHtml, moduleTitle, currentModule, switchingModule, selectedModuleId, hasUnsavedChanges]);

  useEffect(() => {
    if (error) toast({ title: "Erro", description: "Falha ao carregar o editor do curso.", variant: "destructive" });
  }, [error]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        console.log('⚠️ Tentativa de sair com mudanças não salvas');
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Tem certeza que deseja sair?';
        return 'Você tem alterações não salvas. Tem certeza que deseja sair?';
      }
    };

    const handlePopState = async (e: PopStateEvent) => {
      if (hasUnsavedChanges && selectedModuleId) {
        e.preventDefault();
        const shouldSave = window.confirm(
          'Você tem alterações não salvas. Deseja salvar antes de sair?'
        );
        
        if (shouldSave) {
          try {
            await handleSaveModule();
            console.log('✅ Alterações salvas antes de navegar');
          } catch (error) {
            console.error('❌ Erro ao salvar antes de navegar:', error);
            return;
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, selectedModuleId, handleSaveModule]);

  return (
    <DashboardLayout>
      <Helmet>
        <title>Editor do Curso — {courseTitle || "Carregando"} | Esquads</title>
        <meta name="description" content="Editor WYSIWYG do curso para administradores." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <div className="container mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{isNewCourse ? 'Criar novo curso' : 'Editar curso'}</h1>
            <p className="text-muted-foreground">{isNewCourse ? 'Crie um novo curso preenchendo as informações básicas.' : 'Atualize informações e conteúdo dos módulos.'}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isNewCourse && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Publicado</span>
                  <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                </div>
                <Button variant="secondary" onClick={() => refetch()}>Recarregar</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleting}>Excluir</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir curso?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso removerá o curso permanentemente. Se existirem módulos/quizzes/missões vinculados, a exclusão pode falhar.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteCourse} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Confirmar exclusão
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            <Button 
              variant="hero" 
              onClick={handleSaveCourse}
              disabled={isCreatingCourse}
            >
              {isCreatingCourse ? 'Criando...' : (isNewCourse ? 'Criar curso' : 'Salvar curso')}
            </Button>
          </div>
        </header>

        <Tabs 
          defaultValue="conteudo"
          onValueChange={async (newTab) => {
            if (hasUnsavedChanges && selectedModuleId) {
              console.log('💾 Salvando mudanças antes de trocar aba para:', newTab);
              try {
                await handleSaveModule();
                toast({ title: "Sucesso", description: "Alterações salvas automaticamente" });
              } catch (error) {
                console.error('Erro ao salvar antes de trocar aba:', error);
                toast({ title: "Erro", description: "Erro ao salvar alterações", variant: "destructive" });
              }
            }
          }}
        >
          <TabsList>
            <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="missoes">Missões</TabsTrigger>
            <TabsTrigger value="ai-generate">Gerar com IA</TabsTrigger>
          </TabsList>

          <TabsContent value="conteudo">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1"><Skeleton className="h-96" /></Card>
                <Card className="lg:col-span-2"><Skeleton className="h-96" /></Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Informações</CardTitle>
                    <CardDescription>Edite os metadados do curso</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm">Título</label>
                      <Input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm">Descrição</label>
                      <Textarea value={courseDesc} onChange={(e) => setCourseDesc(e.target.value)} rows={4} />
                    </div>
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Capa do Curso</label>
                        {id && (
                          <CourseCoverManager
                            courseId={id}
                            currentImageUrl={data?.course?.cover_image_url}
                            onImageUpdated={(newUrl) => {
                              refetch();
                            }}
                          />
                        )}
                      </div>
                      {data?.course?.cover_image_url ? (
                        <div className="relative">
                          <img
                            src={data.course.cover_image_url}
                            alt={`Capa do curso ${courseTitle}`}
                            className="w-full h-32 object-cover rounded-md border"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-muted rounded-md border flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">Nenhuma capa definida</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <span className="text-sm font-medium">{isPublished ? "published" : status || "draft"}</span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Módulos</h3>
                        <Button size="sm" variant="outline" onClick={handleAddModule}>Adicionar</Button>
                      </div>
                      <div className="space-y-2 max-h-[50vh] overflow-auto pr-1">
                        {data?.modules?.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => handleSelectModule(m)}
                            disabled={switchingModule}
                            className={`w-full text-left rounded-md border px-3 py-2 text-sm transition ${
                              selectedModuleId === m.id 
                                ? "bg-accent" 
                                : switchingModule 
                                  ? "opacity-50 cursor-not-allowed" 
                                  : "hover:bg-accent/50"
                            }`}
                            aria-current={selectedModuleId === m.id}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate">{m.title}</span>
                              <div className="flex items-center space-x-2">
                                {switchingModule && selectedModuleId === m.id && (
                                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                )}
                                <span className="text-xs text-muted-foreground">#{m.order_index}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                        {(!data?.modules || data.modules.length === 0) && (
                          <p className="text-sm text-muted-foreground">Nenhum módulo. Adicione o primeiro.</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Editor WYSIWYG</CardTitle>
                    <CardDescription>Edite o módulo selecionado</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentModule ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm flex items-center gap-2">
                            Título do módulo
                            {hasUnsavedChanges && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                Não salvo
                              </span>
                            )}
                          </label>
                          <Input 
                            value={moduleTitle} 
                            onChange={(e) => setModuleTitle(e.target.value)}
                            className={hasUnsavedChanges ? "border-orange-300 focus:border-orange-500" : ""}
                          />
                        </div>
                        <div>
                          <TiptapAdminEditor
                            ref={tiptapRef}
                            content={moduleHtml}
                            onChange={setModuleHtml}
                            courseId={id || ''}
                            placeholder="Digite o conteúdo do módulo..."
                          />
                        </div>
                        <div className="flex items-center gap-2 justify-between">
                          <AIModuleExtendDialog
                            moduleTitle={moduleTitle}
                            currentHtml={tiptapRef.current?.getHTML() || moduleHtml}
                            onExtended={(extendedHtml) => {
                              try {
                                console.log('🤖 Estendendo conteúdo do módulo com IA...');
                                
                                const currentContent = tiptapRef.current?.getHTML() || moduleHtml;
                                const newContent = `${currentContent}\n\n${extendedHtml}`;
                                
                                console.log('📝 Novo conteúdo:', newContent.substring(0, 200) + '...');
                                
                                // Atualizar estado primeiro
                                setModuleHtml(newContent);
                                
                                // Atualizar editor Tiptap
                                if (tiptapRef.current && tiptapRef.current.setContent) {
                                  setTimeout(() => {
                                    try {
                                      tiptapRef.current?.setContent(newContent);
                                      console.log('✅ Editor atualizado com conteúdo estendido');
                                    } catch (editorError) {
                                      console.warn('⚠️ Erro ao atualizar editor Tiptap:', editorError);
                                    }
                                  }, 100);
                                }
                                
                                setHasUnsavedChanges(true);
                                
                                // Disparar auto-save após extensão do conteúdo
                                console.log('💾 Disparando auto-save após extensão com IA...');
                                setTimeout(() => {
                                  debouncedSave();
                                }, 200);
                                
                                toast({ title: "Sucesso", description: "Conteúdo do módulo estendido com IA" });
                                
                              } catch (error) {
                                console.error('❌ Erro ao estender módulo:', error);
                                toast({ title: "Erro", description: "Erro ao estender módulo com IA", variant: "destructive" });
                              }
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={!selectedModuleId}>Excluir módulo</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir módulo?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso removerá o módulo permanentemente. Se existirem quizzes/missões vinculados, a exclusão pode falhar.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={async () => {
                                      if (!selectedModuleId) {
                                        console.warn('⚠️ Nenhum módulo selecionado para exclusão');
                                        return;
                                      }
                                      
                                      try {
                                        console.log('🗑️ Excluindo módulo:', selectedModuleId);
                                        
                                        const { error } = await supabase
                                          .from("modules")
                                          .delete()
                                          .eq("id", selectedModuleId);
                                          
                                        if (error) {
                                          console.error('❌ Erro ao excluir módulo:', error);
                                          toast({ title: "Erro", description: `Erro ao excluir módulo: ${error.message}`, variant: "destructive" });
                                          return;
                                        }
                                        
                                        console.log('✅ Módulo excluído com sucesso');
                                        toast({ title: "Sucesso", description: "Módulo excluído com sucesso" });
                                        
                                        // Encontrar próximo módulo para selecionar
                                        const remainingModules = data?.modules?.filter(m => m.id !== selectedModuleId) || [];
                                        
                                        if (remainingModules.length > 0) {
                                          // Selecionar o primeiro módulo restante
                                          const nextModule = remainingModules[0];
                                          console.log('📝 Selecionando próximo módulo:', nextModule.title);
                                          setSelectedModuleId(nextModule.id);
                                          setModuleTitle(nextModule.title);
                                          const nextContent = getHtml(nextModule.content_jsonb);
                                          setModuleHtml(nextContent);
                                          
                                          // Atualizar editor
                                          if (tiptapRef.current && tiptapRef.current.setContent) {
                                            setTimeout(() => {
                                              try {
                                                tiptapRef.current?.setContent(nextContent);
                                                console.log('✅ Editor atualizado após exclusão');
                                              } catch (error) {
                                                console.warn('⚠️ Erro ao atualizar editor:', error);
                                              }
                                            }, 100);
                                          }
                                        } else {
                                          // Nenhum módulo restante
                                          console.log('📭 Nenhum módulo restante');
                                          setSelectedModuleId(null);
                                          setModuleTitle("");
                                          setModuleHtml("");
                                          
                                          if (tiptapRef.current && tiptapRef.current.setContent) {
                                            setTimeout(() => {
                                              try {
                                                tiptapRef.current?.setContent("");
                                              } catch (error) {
                                                console.warn('⚠️ Erro ao limpar editor:', error);
                                              }
                                            }, 100);
                                          }
                                        }
                                        
                                        setHasUnsavedChanges(false);
                                        refetch();
                                        
                                      } catch (error) {
                                        console.error('❌ Erro inesperado ao excluir módulo:', error);
                                        toast({ title: "Erro", description: "Erro inesperado ao excluir módulo", variant: "destructive" });
                                      }
                                    }}
                                  >
                                    Confirmar exclusão
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Button variant="secondary" onClick={() => { 
                              setModuleHtml(getHtml(currentModule.content_jsonb)); 
                              setModuleTitle(currentModule.title);
                              setHasUnsavedChanges(false);
                            }}>Reverter</Button>
                            <Button 
                              variant="hero" 
                              onClick={handleSaveModule}
                              className={hasUnsavedChanges ? "bg-orange-600 hover:bg-orange-700" : ""}
                            >
                              {hasUnsavedChanges ? "Salvar mudanças" : "Salvar módulo"}
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Selecione um módulo para editar.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="quizzes">
            {id ? (
              <QuizManager courseId={id} modules={(data?.modules || []).map(m => ({ id: m.id, title: m.title }))} />
            ) : (
              <p className="text-sm text-muted-foreground">Curso inválido.</p>
            )}
          </TabsContent>

          <TabsContent value="missoes">
            {id ? (
              <MissionManager courseId={id} modules={(data?.modules || []).map(m => ({ id: m.id, title: m.title }))} />
            ) : (
              <p className="text-sm text-muted-foreground">Curso inválido.</p>
            )}
          </TabsContent>
          
          <TabsContent value="ai-generate">
            {id && data?.course ? (
              <Card>
                <CardHeader>
                  <CardTitle>Geração Automática com IA</CardTitle>
                  <CardDescription>
                    Gere missões e quizzes automaticamente baseados no conteúdo deste curso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="font-medium">Missões do Curso</h4>
                      <p className="text-sm text-muted-foreground">
                        Crie missões práticas baseadas nos módulos deste curso.
                      </p>
                      <AIGenerationDialog 
                        type="missions" 
                        courseId={id}
                        onSuccess={() => refetch()}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Quizzes do Curso</h4>
                      <p className="text-sm text-muted-foreground">
                        Gere quizzes para avaliar o conhecimento sobre este curso específico.
                      </p>
                      <AIGenerationDialog 
                        type="quizzes" 
                        courseId={id}
                        onSuccess={() => refetch()}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground">Curso inválido.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
