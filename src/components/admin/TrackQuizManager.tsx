import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Quiz { id: string; title: string; description: string | null; is_active: boolean; course_id: string; }
interface TrackCourse { course_id: string }
interface Course { id: string; title: string }

export default function TrackQuizManager({ trackId }: { trackId: string }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [courseId, setCourseId] = useState<string | undefined>(undefined);

  const { data: tcs } = useQuery({
    queryKey: ["track-courses-for-quizzes", trackId],
    queryFn: async (): Promise<TrackCourse[]> => {
      const { data, error } = await supabase.from("track_courses").select("course_id").eq("track_id", trackId);
      if (error) throw error;
      return data as any;
    }
  });
  const courseIds = useMemo(() => Array.from(new Set((tcs || []).map(t => t.course_id))), [tcs]);
  const { data: courses } = useQuery({
    queryKey: ["courses-in-track", courseIds.join(",")],
    enabled: courseIds.length > 0,
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase.from("courses").select("id,title").in("id", courseIds);
      if (error) throw error;
      return data as any;
    }
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["track-quizzes", trackId, courseIds.join(",")],
    enabled: courseIds.length > 0,
    queryFn: async (): Promise<Quiz[]> => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("id,title,description,is_active,course_id")
        .in("course_id", courseIds)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as any;
    },
  });

  const createQuiz = async () => {
    if (!courseId) return toast("Escolha um curso da trilha");
    const { error } = await supabase.from("quizzes").insert({ course_id: courseId, title: title.trim() || "Novo Quiz", description: desc || null, is_active: true, questions: [] });
    if (error) return toast("Erro ao criar quiz");
    setTitle(""); setDesc(""); refetch();
  };

  const toggleActive = async (q: Quiz) => {
    const { error } = await supabase.from("quizzes").update({ is_active: !q.is_active }).eq("id", q.id);
    if (error) return toast("Erro ao atualizar");
    refetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("quizzes").delete().eq("id", id);
    if (error) return toast("Erro ao excluir");
    refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quizzes da trilha</CardTitle>
        <CardDescription>Crie avaliações de certificação associadas a um curso desta trilha.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input placeholder="Título" value={title} onChange={(e)=>setTitle(e.target.value)} />
          <Textarea placeholder="Descrição (opcional)" value={desc} onChange={(e)=>setDesc(e.target.value)} rows={1} />
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger><SelectValue placeholder="Curso da trilha" /></SelectTrigger>
            <SelectContent>
              {(courses || []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={createQuiz}>Adicionar</Button>
        </div>
        <Separator />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando quizzes...</p>
        ) : (data && data.length > 0 ? (
          <ul className="space-y-2">
            {data.map((q) => (
              <li key={q.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{q.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{q.description || "Sem descrição"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Ativo</span>
                    <Switch checked={q.is_active} onCheckedChange={() => toggleActive(q)} />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => remove(q.id)}>Excluir</Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum quiz ainda.</p>
        ))}
      </CardContent>
    </Card>
  );
}
