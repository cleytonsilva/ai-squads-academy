import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "react-router-dom";
type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  status: string;
  is_published: boolean;
  updated_at: string;
  estimated_duration: number | null;
};

const AdminDashboard = () => {
  useEffect(() => {
    document.title = "Admin — Esquads";
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("id,title,description,thumbnail_url,status,is_published,updated_at,estimated_duration")
        .order("updated_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return data as Course[];
    },
  });

  useEffect(() => {
    if (error) toast.error("Não foi possível carregar os cursos.");
  }, [error]);

  const canonical = useMemo(() => {
    try {
      return window.location.href;
    } catch {
      return "/admin";
    }
  }, []);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiTitle, setAiTitle] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("beginner");
  const [aiModules, setAiModules] = useState<number>(12);
  const [includeFinalExam, setIncludeFinalExam] = useState(true);
  const [finalExamDifficulty, setFinalExamDifficulty] = useState("beginner");
  const [finalExamOptions, setFinalExamOptions] = useState<number>(4);
  const [finalExamQuestions, setFinalExamQuestions] = useState<number>(20);
  const [isGenerating, setIsGenerating] = useState(false);
const [imgLoadingCourse, setImgLoadingCourse] = useState<string | null>(null);
const [aiDescription, setAiDescription] = useState("");
const [aiTone, setAiTone] = useState("profissional");
const [audCeo, setAudCeo] = useState(false);
const [audRh, setAudRh] = useState(false);
const [audAdv, setAudAdv] = useState(false);
const [audOutrosChecked, setAudOutrosChecked] = useState(false);
const [audOutrosText, setAudOutrosText] = useState("");


  const handleStartAIGeneration = async () => {
    try {
      setIsGenerating(true);

      const selectedAudience: string[] = [];
      if (audCeo) selectedAudience.push("CEOs");
      if (audRh) selectedAudience.push("RH");
      if (audAdv) selectedAudience.push("Advogados");
      if (audOutrosChecked && audOutrosText.trim()) selectedAudience.push(audOutrosText.trim());
      const audienceString = selectedAudience.length > 0 ? selectedAudience.join(", ") : "profissionais e estudantes de TI no Brasil";

      const { data, error } = await supabase.functions.invoke("ai-generate-course", {
        body: {
          title: aiTitle,
          difficulty: aiDifficulty,
          num_modules: aiModules,
          description: aiDescription,
          tone: aiTone,
          target_audience: selectedAudience,
          audience: audienceString,
          include_final_exam: includeFinalExam,
          final_exam_difficulty: finalExamDifficulty,
          final_exam_options: finalExamOptions,
          final_exam_questions: finalExamQuestions,
          module_length_min: 2200,
          module_length_max: 3200,
        },
      });
      if (error) throw error as any;
      toast.success("Geração iniciada. Atualize em alguns segundos.");
      setAiOpen(false);
      // Tenta refetch depois de alguns segundos
      setTimeout(() => refetch(), 5000);
    } catch (err: any) {
      console.error(err);
      toast.error("Falha ao iniciar geração por IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateCourse = async () => {
    const { data, error } = await supabase.from("courses").insert({
      title: "Novo Curso",
      description: "Rascunho criado pelo administrador",
      ai_generated: false,
      is_published: false,
      status: "draft",
    }).select("id").maybeSingle();

    if (error) {
      toast.error("Falha ao criar curso. Verifique permissões/autenticação.");
      return;
    }
    toast.success("Curso criado com sucesso.");
    refetch();
  };

  const handleGenerateImages = async (courseId: string) => {
    try {
      setImgLoadingCourse(courseId);
      const { data, error } = await supabase.functions.invoke("generate-course-images", {
        body: { courseId },
      });
      if (error) throw error as any;
      if ((data as any)?.requiresSecret) {
        toast.error("Chave da API Corcel não configurada.");
      } else {
        toast.success("Capas geradas com IA. Atualizando...");
      }
      setTimeout(() => refetch(), 1500);
    } catch (e: any) {
      console.error(e);
      toast.error("Falha ao gerar capas com IA");
    } finally {
      setImgLoadingCourse(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin — Gerenciar cursos | Esquads</title>
        <meta name="description" content="Dashboard administrativo Esquads: gerencie cursos, rascunhos e publicações." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <main className="min-h-screen container mx-auto py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Administração</h1>
            <p className="text-muted-foreground">Gerencie cursos e publique conteúdos para os alunos.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => refetch()}>Atualizar</Button>
            <Button asChild variant="outline">
              <Link to="/admin/tracks">Trilhas</Link>
            </Button>
            <Dialog open={aiOpen} onOpenChange={setAiOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Gerar curso com IA</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gerar curso com IA</DialogTitle>
                  <DialogDescription>
                    Crie um curso com módulos e quizzes automaticamente. Você poderá editar antes de publicar.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="ai-title">Título / Tema</Label>
                    <Input
                      id="ai-title"
                      value={aiTitle}
                      onChange={(e) => setAiTitle(e.target.value)}
                      placeholder="Ex.: Fundamentos de Cibersegurança em Cloud"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-description">Descrição do curso (opcional)</Label>
                    <Textarea
                      id="ai-description"
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      placeholder="Descreva objetivos, foco e contexto do curso para orientar a IA"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-difficulty">Nível</Label>
                      <Select value={aiDifficulty} onValueChange={setAiDifficulty}>
                        <SelectTrigger id="ai-difficulty">
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Iniciante</SelectItem>
                          <SelectItem value="intermediate">Intermediário</SelectItem>
                          <SelectItem value="advanced">Avançado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ai-modules">Qtde de módulos</Label>
                      <Input
                        id="ai-modules"
                        type="number"
                        min={8}
                        max={20}
                        value={aiModules}
                        onChange={(e) => setAiModules(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-tone">Tom do curso</Label>
                    <Select value={aiTone} onValueChange={setAiTone}>
                      <SelectTrigger id="ai-tone">
                        <SelectValue placeholder="Selecione o tom" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="profissional">Profissional/Neutro</SelectItem>
                        <SelectItem value="técnico">Técnico</SelectItem>
                        <SelectItem value="conversacional">Conversacional</SelectItem>
                        <SelectItem value="inspirador">Inspirador</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="informal">Informal</SelectItem>
                        <SelectItem value="humor">Humor leve</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Público-alvo</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2">
                        <Checkbox checked={audCeo} onCheckedChange={(v) => setAudCeo(Boolean(v))} />
                        <span>CEO</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <Checkbox checked={audRh} onCheckedChange={(v) => setAudRh(Boolean(v))} />
                        <span>RH</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <Checkbox checked={audAdv} onCheckedChange={(v) => setAudAdv(Boolean(v))} />
                        <span>Advogados</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <Checkbox checked={audOutrosChecked} onCheckedChange={(v) => setAudOutrosChecked(Boolean(v))} />
                        <span>Outros</span>
                      </label>
                    </div>
                    {audOutrosChecked && (
                      <Input
                        value={audOutrosText}
                        onChange={(e) => setAudOutrosText(e.target.value)}
                        placeholder="Digite a profissão para incluir"
                      />
                    )}
                  </div>

                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="include-final">Incluir Prova Final</Label>
                      <Switch id="include-final" checked={includeFinalExam} onCheckedChange={setIncludeFinalExam} />
                    </div>
                    {includeFinalExam && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="final-difficulty">Nível da Prova</Label>
                          <Select value={finalExamDifficulty} onValueChange={setFinalExamDifficulty}>
                            <SelectTrigger id="final-difficulty">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Iniciante</SelectItem>
                              <SelectItem value="intermediate">Intermediário</SelectItem>
                              <SelectItem value="advanced">Avançado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="final-options">Opções por questão</Label>
                          <Input id="final-options" type="number" min={2} max={6} value={finalExamOptions} onChange={(e) => setFinalExamOptions(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="final-questions">Qtd. de questões</Label>
                          <Input id="final-questions" type="number" min={5} max={50} value={finalExamQuestions} onChange={(e) => setFinalExamQuestions(Number(e.target.value))} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setAiOpen(false)} disabled={isGenerating}>Cancelar</Button>
                  <Button onClick={handleStartAIGeneration} disabled={isGenerating || !aiTitle.trim()}>
                    {isGenerating ? "Gerando..." : "Gerar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="hero" onClick={handleCreateCourse}>Novo curso</Button>
          </div>
        </header>

        <section aria-labelledby="galeria-cursos">
          <h2 id="galeria-cursos" className="sr-only">Galeria de cursos</h2>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-40 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (data && data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.map((course) => (
                <Card key={course.id} className="overflow-hidden">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={`Capa do curso ${course.title}`}
                      loading="lazy"
                      className="h-40 w-full object-cover"
                    />
                   ) : (
                    <button
                      className="h-40 w-full bg-muted flex items-center justify-center hover:opacity-90 transition"
                      aria-label="Gerar capa do curso"
                      onClick={() => handleGenerateImages(course.id)}
                      disabled={imgLoadingCourse === course.id}
                    >
                      {imgLoadingCourse === course.id ? "Gerando capa..." : "Gerar capa com IA"}
                    </button>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description || "Sem descrição"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <Badge variant={course.is_published ? "default" : "secondary"}>
                      {course.is_published ? "Publicado" : (course.status || "Rascunho")}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        Atualizado {new Date(course.updated_at).toLocaleDateString()}
                      </span>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/admin/courses/${course.id}`}>Editar</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <CardHeader>
                <CardTitle>Nenhum curso encontrado</CardTitle>
                <CardDescription>Crie seu primeiro curso para começar.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleCreateCourse}>Criar curso</Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </>
  );
};

export default AdminDashboard;
