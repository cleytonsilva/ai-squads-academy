import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface Course {
  id: string;
  title: string;
  description: string | null;
}

interface ModuleRow {
  id: string;
  title: string;
  order_index: number;
  content_jsonb: any | null;
}

export default function CourseView() {
  const { id } = useParams<{ id: string }>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["course-view", id],
    enabled: !!id,
    queryFn: async (): Promise<{ course: Course | null; modules: ModuleRow[] }> => {
      const [{ data: course, error: cErr }, { data: modules, error: mErr }] = await Promise.all([
        supabase.from("courses").select("id,title,description").eq("id", id!).maybeSingle(),
        supabase.from("modules").select("id,title,order_index,content_jsonb").eq("course_id", id!).order("order_index", { ascending: true }),
      ]);
      if (cErr) throw cErr;
      if (mErr) throw mErr;
      return { course: course as any, modules: (modules || []) as any };
    },
  });

  useEffect(() => {
    if (data?.modules && data.modules.length > 0) setSelectedIndex(0);
  }, [data?.modules?.length]);

  useEffect(() => { document.title = data?.course?.title ? `${data.course.title} — Esquads` : "Curso — Esquads"; }, [data?.course?.title]);

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

  const goPrev = () => setSelectedIndex((i) => Math.max(0, i - 1));
  const goNext = () => setSelectedIndex((i) => Math.min((data?.modules?.length || 1) - 1, i + 1));

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
                      <span className="ml-2 text-xs text-muted-foreground">#{m.order_index}</span>
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
    </main>
  );
}
