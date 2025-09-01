import { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QuizRunner from "@/components/app/QuizRunner";
import { useTheme } from "@/contexts/theme-context";
import CourseHeader from "@/components/course/course-header";
import ModulesList from "@/components/course/modules-list";
import ModuleContent from "@/components/course/module-content";
import QuizSection from "@/components/course/quiz-section";
import NavigationControls from "@/components/course/navigation-controls";

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
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
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
      if (isFinalCurrent && !finalExamModule) {
        // Reset timers for synthetic final module (UI-only)
        prevModuleIdRef.current = null;
        moduleStartAtRef.current = null;
      } else {
        if (prevModuleIdRef.current && moduleStartAtRef.current != null) {
          const sec = Math.floor((now - moduleStartAtRef.current) / 1000);
          accumulateTimeSpent(prevModuleIdRef.current, sec);
        }
        prevModuleIdRef.current = current.id;
        moduleStartAtRef.current = now;
      }
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

  const quizzes: QuizRow[] = (data as any)?.quizzes || [];

  const finalQuizzes = useMemo(() => quizzes.filter((q) => !q.module_id), [quizzes]);
  const finalExamQuiz = useMemo(() => finalQuizzes[0] || null, [finalQuizzes]);

  const finalExamModule = useMemo(() => {
    return (data?.modules || []).find((m: any) => m.module_type === "final_exam") || null;
  }, [data?.modules]);

  const displayModules: ModuleRow[] = useMemo(() => {
    const base = (data?.modules || []) as ModuleRow[];
    if (finalExamModule) return base;
    if (finalQuizzes.length > 0 && base.length > 0) {
      const lastOrder = base[base.length - 1]?.order_index ?? base.length;
      const synthetic: ModuleRow = {
        id: "final-synthetic",
        title: "Prova final",
        order_index: lastOrder + 1,
        content_jsonb: { html: "<p>Prova final do curso</p>" },
        module_type: "final_exam",
      } as any;
      return [...base, synthetic];
    }
    return base;
  }, [data?.modules, finalExamModule, finalQuizzes.length]);

  const current = displayModules?.[selectedIndex] || null;

  const moduleQuizzes = useMemo(() => {
    if (!current?.id) return [] as QuizRow[];
    return quizzes.filter((q) => q.module_id === current.id);
  }, [quizzes, current?.id]);

  const isFinalCurrent = (current as any)?.module_type === "final_exam";
  const isSyntheticFinalCurrent = useMemo(() => !finalExamModule && isFinalCurrent, [finalExamModule, isFinalCurrent]);

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

  const nonFinalModules = useMemo(() => (displayModules || []).filter((m: any) => m.module_type !== "final_exam"), [displayModules]);
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
      if (isFinalCurrent && !finalExamModule) return;
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
      toast.success('Módulo concluído! +50 XP ganhos');

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
        toast.success('Curso concluído! Parabéns! +200 XP');
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
    setSelectedIndex((i) => Math.min((displayModules?.length || 1) - 1, i + 1));
  };
  return (
    <main className={`container mx-auto py-8 transition-colors duration-300 ${themeColors.background}`}>
      <Helmet>
        <title>{data?.course?.title ? `${data.course.title} | Esquads` : "Carregando curso | Esquads"}</title>
        <meta name="description" content={data?.course?.description || "Visualização do curso para estudantes."} />
        <link rel="canonical" href={canonical} />
      </Helmet>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className={`lg:col-span-1 transition-colors duration-300 ${themeColors.card} ${themeColors.border}`}><Skeleton className="h-96" /></Card>
          <Card className={`lg:col-span-2 transition-colors duration-300 ${themeColors.card} ${themeColors.border}`}><Skeleton className="h-96" /></Card>
        </div>
      ) : error ? (
        <Card className={`p-8 text-center transition-colors duration-300 ${themeColors.card} ${themeColors.border}`}>
          <CardHeader>
            <CardTitle className={themeColors.foreground}>Erro ao carregar</CardTitle>
            <CardDescription className={themeColors.mutedForeground}>Tente novamente mais tarde.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className={`lg:col-span-1 transition-colors duration-300 ${themeColors.card} ${themeColors.border}`}>
            <CourseHeader 
              title={data?.course?.title || "Curso"}
              description={data?.course?.description}
            />
            <ModulesList
              modules={displayModules || []}
              selectedIndex={selectedIndex}
              completedIds={completedIds}
              unlockedFinalExam={unlockedFinalExam}
              onSelectModule={setSelectedIndex}
            />
          </Card>

          <Card className={`lg:col-span-2 transition-colors duration-300 ${themeColors.card} ${themeColors.border}`}>
            <ModuleContent currentModule={current}>
              {current && (
                <>
                  <QuizSection
                    currentModule={current}
                    moduleQuizzes={moduleQuizzes}
                    finalExamQuiz={finalExamQuiz}
                    isLastModule={selectedIndex === (displayModules?.length || 0) - 1}
                    unlockedFinalExam={unlockedFinalExam}
                    isFinalCurrent={isFinalCurrent}
                    finalExamModule={finalExamModule}
                    onOpenQuiz={setOpenQuiz}
                  />
                  <NavigationControls
                    selectedIndex={selectedIndex}
                    totalModules={displayModules?.length || 1}
                    onPrevious={goPrev}
                    onNext={goNext}
                  />
                </>
              )}
            </ModuleContent>
          </Card>
        </div>
      )}
      <Dialog open={!!openQuiz} onOpenChange={(o) => !o && setOpenQuiz(null)}>
        <DialogContent className={`w-[95vw] sm:w-[90vw] md:w-[80vw] lg:max-w-3xl max-h-[90vh] overflow-y-auto transition-colors duration-300 ${themeColors.card} ${themeColors.border}`}>
          <DialogHeader>
            <DialogTitle className={`transition-colors duration-300 ${themeColors.foreground}`}>{openQuiz?.title || "Quiz"}</DialogTitle>
          </DialogHeader>
          {openQuiz && <QuizRunner quiz={openQuiz} onClose={() => setOpenQuiz(null)} courseId={id!} courseDifficulty={data?.course?.difficulty_level || null} isFinalExam={isFinalExamForOpen} />}
        </DialogContent>
      </Dialog>
    </main>
  );
}
