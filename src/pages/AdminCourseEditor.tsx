import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import QuizManager from "@/components/admin/QuizManager";
import MissionManager from "@/components/admin/MissionManager";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import AIGenerationDialog from "@/components/admin/AIGenerationDialog";
import AIModuleGenerationDialog from "@/components/admin/AIModuleGenerationDialog";
interface Course {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  status: string;
  thumbnail_url: string | null;
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
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleHtml, setModuleHtml] = useState("");

  const canonical = useMemo(() => {
    try { return window.location.href } catch { return `/admin/courses/${id}` }
  }, [id]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-course-editor", id],
    enabled: !!id,
    queryFn: async () => {
      const [{ data: course, error: cErr }, { data: modules, error: mErr }] = await Promise.all([
        supabase.from("courses").select("id,title,description,is_published,status,thumbnail_url").eq("id", id!).maybeSingle(),
        supabase.from("modules").select("id,course_id,title,order_index,content_jsonb").eq("course_id", id!).order("order_index", { ascending: true }),
      ]);
      if (cErr) throw cErr;
      if (mErr) throw mErr;
      return { course, modules } as { course: Course; modules: ModuleRow[] };
    },
  });

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
      setSelectedModuleId(first.id);
      setModuleTitle(first.title);
      setModuleHtml(getHtml(first.content_jsonb));
    }
  }, [data?.modules, selectedModuleId]);

  useEffect(() => {
    if (error) toast.error("Falha ao carregar o editor do curso.");
  }, [error]);

  const currentModule = data?.modules?.find((m) => m.id === selectedModuleId) || null;

  const handleSaveCourse = async () => {
    if (!id) return;
    const { error } = await supabase
      .from("courses")
      .update({ title: courseTitle, description: courseDesc, is_published: isPublished, status })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao salvar curso");
    } else {
      toast.success("Curso salvo");
      refetch();
    }
  };

  const handleDeleteCourse = async () => {
    if (!id) return;
    try {
      setDeleting(true);
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Curso excluído");
      navigate("/admin");
    } catch (e: any) {
      toast.error("Erro ao excluir curso", { description: e?.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectModule = (m: ModuleRow) => {
  setSelectedModuleId(m.id);
  setModuleTitle(m.title);
  setModuleHtml(getHtml(m.content_jsonb));
  };
  const handleSaveModule = async () => {
    if (!selectedModuleId) return;
    const { error } = await supabase
      .from("modules")
      .update({ title: moduleTitle, content_jsonb: { html: moduleHtml } })
      .eq("id", selectedModuleId);
    if (error) {
      toast.error("Erro ao salvar módulo");
    } else {
      toast.success("Módulo salvo");
      refetch();
    }
  };

  const handleAddModule = async () => {
    if (!id) return;
    const lastIndex = (data?.modules?.[data.modules.length - 1]?.order_index ?? 0) + 1;
    const { data: inserted, error } = await supabase
      .from("modules")
      .insert({ course_id: id, title: "Novo módulo", order_index: lastIndex, content_jsonb: { html: "" } })
      .select("id,title,order_index,content_jsonb")
      .maybeSingle();
    if (error) {
      toast.error("Erro ao criar módulo");
    } else if (inserted) {
      toast.success("Módulo criado");
  setSelectedModuleId(inserted.id);
  setModuleTitle(inserted.title);
  setModuleHtml(getHtml(inserted.content_jsonb));
  refetch();
    }
  const handleDeleteModule = async (moduleId: string) => {
    if (!moduleId) return;
    const confirmDelete = window.confirm("Excluir este módulo? Esta ação não pode ser desfeita.");
    if (!confirmDelete) return;
    const { error } = await supabase.from("modules").delete().eq("id", moduleId);
    if (error) {
      toast.error("Erro ao excluir módulo");
    } else {
      toast("Módulo excluído");
      if (selectedModuleId === moduleId) {
        const remaining = (data?.modules || []).filter(m => m.id !== moduleId);
        const next = remaining[0];
        setSelectedModuleId(next ? next.id : null);
        setModuleTitle(next ? next.title : "");
        setModuleHtml(next ? getHtml(next.content_jsonb) : "");
      }
      refetch();
    }
  };
  return (
      <>\n      <Helmet>
        <title>Editor do Curso — {courseTitle || "Carregando"} | Esquads</title>
        <meta name="description" content="Editor WYSIWYG do curso para administradores." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <main className="container mx-auto py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Editar curso</h1>
            <p className="text-muted-foreground">Atualize informações e conteúdo dos módulos.</p>
          </div>
          <div className="flex items-center gap-2">
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
            <Button variant="hero" onClick={handleSaveCourse}>Salvar curso</Button>
          </div>
        </header>

          <Tabs defaultValue="conteudo">
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
                  {/* Sidebar do curso */}
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
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <span className="text-sm font-medium">{isPublished ? "published" : status || "draft"}</span>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Módulos</h3>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={handleAddModule}>Adicionar</Button>
                            {id && <AIModuleGenerationDialog courseId={id} onSuccess={() => refetch()} />}
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={!selectedModuleId}
                              onClick={() => selectedModuleId && handleDeleteModule(selectedModuleId)}
                            >
                              Excluir selecionado
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 max-h-[50vh] overflow-auto pr-1">
                          {data?.modules?.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => handleSelectModule(m)}
                              className={`w-full text-left rounded-md border px-3 py-2 text-sm transition ${selectedModuleId === m.id ? "bg-accent" : "hover:bg-accent/50"}`}
                              aria-current={selectedModuleId === m.id}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">{m.title}</span>
                                <span className="ml-2 text-xs text-muted-foreground">#{m.order_index}</span>
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

                  {/* Editor principal */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Editor WYSIWYG</CardTitle>
                      <CardDescription>Edite o módulo selecionado</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentModule ? (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm">Título do módulo</label>
                            <Input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} />
                          </div>
                          <div className="rounded-md border">
                            <ReactQuill theme="snow" value={moduleHtml} onChange={setModuleHtml} />
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <Button variant="secondary" onClick={() => { setModuleHtml(getHtml(currentModule.content_jsonb)); setModuleTitle(currentModule.title); }}>Reverter</Button>
                            <Button variant="hero" onClick={handleSaveModule}>Salvar módulo</Button>
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
      </main>
    </>
  );
}
