import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QuizRunner from "@/components/app/QuizRunner";
import { CheckCircle2, Circle, Lock } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  difficulty_level?: string | null;
}

interface ModuleRow {
  id: string;
  title: string;
  order_index: number;
  content_jsonb: any | null;
  module_type?: string | null;
}

interface QuizRow {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  module_id: string | null;
  questions?: any[];
}


export default function CourseView() {
  const { id } = useParams<{ id: string }>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { toast } = useToast();
  const { addXP } = useAppStore();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [openQuiz, setOpenQuiz] = useState<QuizRow | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["course-view", id],
    enabled: !!id,
    queryFn: async (): Promise<{ course: Course | null; modules: ModuleRow[]; quizzes: QuizRow[] }> => {
      const [
        { data: course, error: cErr },
        { data: modules, error: mErr },
        { data: quizzes, error: qErr },
      ] = await Promise.all([
        supabase.from("courses").select("id,title,description,difficulty_level").eq("id", id!).maybeSingle(),
        supabase.from("modules").select("id,title,order_index,content_jsonb,module_type").eq("course_id", id!).order("order_index", { ascending: true }),
        supabase.from("quizzes").select("id,title,description,is_active,module_id,questions").eq("course_id", id!).eq("is_active", true).order("updated_at", { ascending: false }),
      ]);
      if (cErr) throw cErr;
      if (mErr) throw mErr;
      if (qErr) throw qErr;
      return { course: course as any, modules: (modules || []) as any, quizzes: (quizzes || []) as any };
    },
  });

  useEffect(() => {
    if (data?.modules && data.modules.length > 0) setSelectedIndex(0);
  }, [data?.modules?.length]);

  useEffect(() => { document.title = data?.course?.title ? `${data.course.title} — Esquads` : "Curso — Esquads"; }, [data?.course?.title]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user || !id) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (profile?.id) {
          setProfileId(profile.id);
          const { data: rows } = await supabase
            .from("user_progress")
            .select("module_id,is_completed")
            .eq("user_id", profile.id)
            .eq("course_id", id);
          if (rows) {
            const set = new Set<string>();
            rows.forEach((r: any) => { if (r.is_completed && r.module_id) set.add(r.module_id as string); });
            setCompletedIds(set);
          }
        }
      } catch (e) {
        console.error("Erro ao carregar progresso:", e);
      }
    };
    load();
  }, [id]);

  const moduleStartAtRef = useRef<number | null>(null);
  const prevModuleIdRef = useRef<string | null>(null);

  const accumulateTimeSpent = async (moduleId: string, seconds: number) => {
    if (!profileId || !id || !moduleId || seconds <= 0) return;
    try {
      const { data: row } = await supabase
        .from("user_progress")
        .select("id,time_spent")
        .eq("user_id", profileId)
        .eq("course_id", id)
        .eq("module_id", moduleId)
        .maybeSingle();
      if (row?.id) {
        const newTime = (row.time_spent || 0) + seconds;
        await supabase
          .from("user_progress")
          .update({ time_spent: newTime, last_accessed_at: new Date().toISOString() })
          .eq("id", row.id);
      } else {
        await supabase.from("user_progress").insert({
          user_id: profileId,
          course_id: id,
          module_id: moduleId,
          is_completed: false,
          time_spent: seconds,
          last_accessed_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("Erro ao salvar tempo:", e);
    }
  };

  useEffect(() => {
    const now = Date.now();
    if (current?.id) {
      if (prevModuleIdRef.current && moduleStartAtRef.current != null) {
        const sec = Math.floor((now - moduleStartAtRef.current) / 1000);
        accumulateTimeSpent(prevModuleIdRef.current, sec);
      }
      prevModuleIdRef.current = current.id;
      moduleStartAtRef.current = now;
    }
    return () => {
      if (prevModuleIdRef.current && moduleStartAtRef.current != null) {
        const sec = Math.floor((Date.now() - moduleStartAtRef.current) / 1000);
        accumulateTimeSpent(prevModuleIdRef.current, sec);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  const canonical = useMemo(() => {
    try { return window.location.href } catch { return `/courses/${id}` }
  }, [id]);
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

  const current = data?.modules?.[selectedIndex] || null;

  const quizzes: QuizRow[] = (data as any)?.quizzes || [];
  const moduleQuizzes = useMemo(() => {
    if (!current?.id) return [] as QuizRow[];
    return quizzes.filter((q) => q.module_id === current.id);
  }, [quizzes, current?.id]);

  const finalQuizzes = useMemo(() => quizzes.filter((q) => !q.module_id), [quizzes]);

  const finalExamModule = useMemo(() => {
    return (data?.modules || []).find((m: any) => m.module_type === "final_exam") || null;
  }, [data?.modules]);

  const isFinalCurrent = (current as any)?.module_type === "final_exam";

  const quizIds = useMemo(() => quizzes.map((q) => q.id), [quizzes]);
  const { data: attempts } = useQuery({
    queryKey: ["quiz-attempts", id, profileId, quizIds.length],
    enabled: !!profileId && quizIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("quiz_attempts")
        .select("quiz_id,score,created_at")
        .eq("user_id", profileId!);
      return (data || []).filter((a: any) => quizIds.includes(a.quiz_id));
    },
  });

  const latestByQuiz = useMemo(() => {
    const map = new Map<string, { score: number; created_at: string }>();
    (attempts || []).forEach((a: any) => {
      const ex = map.get(a.quiz_id);
      if (!ex || a.created_at > ex.created_at) map.set(a.quiz_id, { score: a.score, created_at: a.created_at });
    });
    return map;
  }, [attempts]);

  const passedAllModuleQuizzes = useMemo(() => {
    const moduleQs = quizzes.filter((q) => q.module_id);
    return moduleQs.every((q) => {
      const len = Array.isArray(q.questions) ? q.questions.length : 1;
      const att = latestByQuiz.get(q.id);
      return !!att && att.score >= Math.ceil(0.7 * len);
    });
  }, [quizzes, latestByQuiz]);

  const nonFinalModules = useMemo(() => (data?.modules || []).filter((m: any) => m.module_type !== "final_exam"), [data?.modules]);
  const completedNonFinalCount = useMemo(() => nonFinalModules.filter((m) => completedIds.has(m.id)).length, [nonFinalModules, completedIds]);

  const unlockedFinalExam = useMemo(() => {
    return nonFinalModules.length > 0 && completedNonFinalCount >= nonFinalModules.length;
  }, [nonFinalModules.length, completedNonFinalCount]);

  const isFinalExamForOpen = useMemo(() => {
    if (!openQuiz) return false;
    if (isFinalCurrent) return true;
    if (!finalExamModule && !openQuiz.module_id) return true;
    return false;
  }, [openQuiz, isFinalCurrent, finalExamModule]);

  useEffect(() => {
    const saveLastAccess = async () => {
      if (!profileId || !current?.id || !id) return;
      try {
        const { data: existing } = await supabase
          .from("user_progress")
          .select("id")
          .eq("user_id", profileId)
          .eq("course_id", id)
          .eq("module_id", current.id)
          .maybeSingle();
        if (existing?.id) {
          await supabase
            .from("user_progress")
            .update({ last_accessed_at: new Date().toISOString() })
            .eq("id", existing.id);
        } else {
          await supabase.from("user_progress").insert({
            user_id: profileId,
            course_id: id,
            module_id: current.id,
            is_completed: false,
            last_accessed_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error("Erro ao salvar progresso:", e);
      }
    };
    saveLastAccess();
  }, [selectedIndex, profileId, current?.id, id]);

  const markModuleCompleted = async () => {
    if (!profileId || !current?.id || !id) return;
    if (completedIds.has(current.id)) return;

    try {
      const { data: existing } = await supabase
        .from("user_progress")
        .select("id,is_completed")
        .eq("user_id", profileId)
        .eq("course_id", id)
        .eq("module_id", current.id)
        .maybeSingle();

      if (existing?.id && !existing.is_completed) {
        await supabase
          .from("user_progress")
          .update({ is_completed: true, completed_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else if (!existing?.id) {
        await supabase.from("user_progress").insert({
          user_id: profileId,
          course_id: id,
          module_id: current.id,
          is_completed: true,
          completed_at: new Date().toISOString(),
        });
      }

      setCompletedIds((prev) => new Set(prev).add(current.id));

      const { data: prof } = await supabase
        .from("profiles")
        .select("xp")
        .eq("id", profileId)
        .maybeSingle();
      const newXP = (prof?.xp || 0) + 50;
      await supabase.from("profiles").update({ xp: newXP }).eq("id", profileId);
      addXP(50);
      toast({ title: "Módulo concluído", description: "+50 XP ganhos" });

      const total = data?.modules?.length || 0;
      if (total > 0 && (completedIds.size + 1) >= total) {
        const { data: prof2 } = await supabase
          .from("profiles")
          .select("xp")
          .eq("id", profileId)
          .maybeSingle();
        const newXP2 = (prof2?.xp || 0) + 200;
        await supabase.from("profiles").update({ xp: newXP2 }).eq("id", profileId);
        addXP(200);
        toast({ title: "Curso concluído!", description: "Parabéns! +200 XP" });
      }
    } catch (e) {
      console.error("Erro ao concluir módulo:", e);
    }
  };

  const goPrev = () => setSelectedIndex((i) => Math.max(0, i - 1));
  const goNext = async () => {
    if (current?.id && moduleStartAtRef.current != null) {
      const sec = Math.floor((Date.now() - moduleStartAtRef.current) / 1000);
      await accumulateTimeSpent(current.id, sec);
    }
    await markModuleCompleted();
    setSelectedIndex((i) => Math.min((data?.modules?.length || 1) - 1, i + 1));
  };
  return (
    <main className="container mx-auto py-8">
      <Helmet>
        <title>{data?.course?.title ? `${data.course.title} | Esquads` : "Carregando curso | Esquads"}</title>
        <meta name="description" content={data?.course?.description || "Visualização do curso para estudantes."} />
        <link rel="canonical" href={canonical} />
      </Helmet>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1"><Skeleton className="h-96" /></Card>
          <Card className="lg:col-span-2"><Skeleton className="h-96" /></Card>
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <CardHeader>
            <CardTitle>Erro ao carregar</CardTitle>
            <CardDescription>Tente novamente mais tarde.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{data?.course?.title || "Curso"}</CardTitle>
              <CardDescription className="line-clamp-3">{data?.course?.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/courses" className="text-sm underline">Voltar para cursos</Link>
              <Separator />
              <h2 className="font-medium">Módulos</h2>
              <div className="space-y-2 max-h-[55vh] overflow-auto pr-1">
                {data?.modules?.map((m, idx) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedIndex(idx)}
                    className={`w-full text-left rounded-md border px-3 py-2 text-sm transition ${idx === selectedIndex ? "bg-accent" : "hover:bg-accent/50"}`}
                    aria-current={idx === selectedIndex}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{idx + 1}. {m.title}</span>
                      <span className="ml-2">
                        {(m as any).module_type === "final_exam" ? (
                          unlockedFinalExam ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          completedIds.has(m.id) ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </span>
                    </div>
                  </button>
                ))}
                {(!data?.modules || data.modules.length === 0) && (
                  <p className="text-sm text-muted-foreground">Nenhum módulo disponível.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{current ? current.title : "Selecione um módulo"}</CardTitle>
              <CardDescription>Visualização do aluno</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {current ? (
                <div className="space-y-4">
                  <article className="rounded-md border p-4">
                    <div dangerouslySetInnerHTML={{ __html: getHtml(current.content_jsonb) }} />
                  </article>

                  {!isFinalCurrent && current?.order_index !== 10 && moduleQuizzes.length > 0 && (
                    <section className="rounded-md border p-4">
                      <h3 className="font-medium">Quiz do módulo</h3>
                      <ul className="mt-2 space-y-2">
                        {moduleQuizzes.map((q) => (
                          <li key={q.id} className="flex items-center justify-between rounded-md border p-3">
                            <div>
                              <p className="font-medium">{q.title}</p>
                              {q.description && (
                                <p className="text-sm text-muted-foreground">{q.description}</p>
                              )}
                            </div>
                            <Button variant="outline" onClick={() => setOpenQuiz(q)}>
                              Responder
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {isFinalCurrent && moduleQuizzes.length > 0 && (
                    <section className="rounded-md border p-4">
                      <h3 className="font-medium">Prova final</h3>
                      {!unlockedFinalExam && isFinalCurrent && (
                        <p className="text-sm text-muted-foreground mt-1">Finalize todos os módulos para liberar a prova final.</p>
                      )}
                      <ul className="mt-2 space-y-2">
                        {moduleQuizzes.map((q) => (
                          <li key={q.id} className="flex items-center justify-between rounded-md border p-3">
                            <div>
                              <p className="font-medium">{q.title}</p>
                              {q.description && (
                                <p className="text-sm text-muted-foreground">{q.description}</p>
                              )}
                            </div>
                            <Button variant="outline" onClick={() => setOpenQuiz(q)} disabled={isFinalCurrent && !unlockedFinalExam}>
                              {isFinalCurrent ? (unlockedFinalExam ? "Iniciar" : "Bloqueado") : "Responder"}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                    {!finalExamModule && selectedIndex === (data?.modules?.length || 0) - 1 && finalQuizzes.length > 0 && (
                      <section className="rounded-md border p-4">
                        <h3 className="font-medium">Prova final do curso</h3>
                        {!unlockedFinalExam && (
                          <p className="text-sm text-muted-foreground mt-1">Finalize todos os módulos para liberar a prova final.</p>
                        )}
                        <ul className="mt-2 space-y-2">
                          {finalQuizzes.map((q) => (
                            <li key={q.id} className="flex items-center justify-between rounded-md border p-3">
                              <div>
                                <p className="font-medium">{q.title}</p>
                                {q.description && (
                                  <p className="text-sm text-muted-foreground">{q.description}</p>
                                )}
                              </div>
                              <Button onClick={() => setOpenQuiz(q)} disabled={!unlockedFinalExam}>
                                {unlockedFinalExam ? "Iniciar" : "Bloqueado"}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                  <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={goPrev} disabled={selectedIndex === 0}>Anterior</Button>
                    <Button onClick={goNext} disabled={selectedIndex >= (data?.modules?.length || 1) - 1}>Próximo</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Escolha um módulo para começar.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      <Dialog open={!!openQuiz} onOpenChange={(o) => !o && setOpenQuiz(null)}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{openQuiz?.title || "Quiz"}</DialogTitle>
          </DialogHeader>
          {openQuiz && <QuizRunner quiz={openQuiz} onClose={() => setOpenQuiz(null)} courseId={id!} courseDifficulty={data?.course?.difficulty_level || null} isFinalExam={isFinalExamForOpen} />}
        </DialogContent>
      </Dialog>
    </main>
  );
}
