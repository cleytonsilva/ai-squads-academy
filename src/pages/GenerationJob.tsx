import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function GenerationJob() {
  const { jobId } = useParams();
  const canonical = useMemo(() => {
    try { return window.location.href; } catch { return "/admin/generation"; }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["generation-job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generation_jobs")
        .select("id,status,error,output,created_at,updated_at")
        .eq("id", jobId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    refetchInterval: (q) => {
      const s = (q.state.data as any)?.status;
      return s && (s === "completed" || s === "failed") ? false : 1500;
    },
    enabled: Boolean(jobId),
  });

  const status = data?.status as string | undefined;
  const output = (data?.output || {}) as any;
  const modules = Array.isArray(output?.progress_modules) ? output.progress_modules : [];
  const events = Array.isArray(output?.events) ? output.events : [];
  const courseId = output?.course_id as string | undefined;

  return (
    <main className="container mx-auto py-10">
      <Helmet>
        <title>Acompanhar geração de curso | Esquads</title>
        <meta name="description" content="Veja em tempo real os módulos e logs da geração do curso por IA." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <Card>
        <CardHeader>
          <CardTitle>Acompanhamento da geração</CardTitle>
          <CardDescription>
            Status: <strong>{status || (isLoading ? "carregando..." : "desconhecido")}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "failed" && (
            <Alert variant="destructive">
              <AlertTitle>Falha na geração do curso</AlertTitle>
              <AlertDescription>{data?.error || "Tente novamente mais tarde."}</AlertDescription>
            </Alert>
          )}
          <section>
            {modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aguardando criação dos primeiros módulos...</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {modules.map((m: any) => (
                  <li key={m.index} className="text-sm">{m.index + 1}. {m.title}</li>
                ))}
              </ul>
            )}
          </section>

          <Separator />

          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Logs</h2>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem logs ainda...</p>
            ) : (
              <div className="max-h-64 overflow-auto rounded border border-border p-3 bg-background">
                <ul className="space-y-1">
                  {events.map((e: any, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground">
                      <span className="font-mono">{new Date(e.at).toLocaleTimeString()}</span> — {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/admin">Voltar ao Admin</Link></Button>
            {status === "completed" && courseId && (
              <Button asChild><Link to={`/admin/courses/${courseId}`}>Ir para o curso</Link></Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
