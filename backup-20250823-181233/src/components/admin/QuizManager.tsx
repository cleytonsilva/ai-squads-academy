import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export interface ModuleOption {
  id: string;
  title: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  module_id: string | null;
}

export default function QuizManager({ courseId, modules }: { courseId: string; modules: ModuleOption[] }) {
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const moduleMap = useMemo(() => Object.fromEntries(modules.map(m => [m.id, m.title])), [modules]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["quizzes", courseId],
    queryFn: async (): Promise<Quiz[]> => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("id,title,description,is_active,module_id")
        .eq("course_id", courseId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Quiz[];
    },
  });

  const handleCreate = async () => {
    const payload = {
      course_id: courseId,
      title: newTitle.trim() || "Novo Quiz",
      description: newDesc.trim() || null,
      is_active: true,
    };
    const { error } = await supabase.from("quizzes").insert(payload);
    if (error) return toast.error("Erro ao criar quiz");
    toast.success("Quiz criado");
    setNewTitle("");
    setNewDesc("");
    refetch();
  };

  const toggleActive = async (q: Quiz) => {
    const { error } = await supabase.from("quizzes").update({ is_active: !q.is_active }).eq("id", q.id);
    if (error) return toast.error("Erro ao atualizar status");
    refetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("quizzes").delete().eq("id", id);
    if (error) return toast.error("Erro ao remover quiz");
    toast.success("Removido");
    refetch();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quizzes</CardTitle>
          <CardDescription>Crie e gerencie quizzes deste curso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Título do quiz" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Textarea placeholder="Descrição (opcional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={1} />
            <Button onClick={handleCreate}>Adicionar quiz</Button>
          </div>
          <Separator />
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando quizzes...</p>
          ) : data && data.length > 0 ? (
            <ul className="space-y-2">
              {data.map((q) => (
                <li key={q.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{q.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {q.description || "Sem descrição"}
                      {q.module_id ? ` • Módulo: ${moduleMap[q.module_id] || "-"}` : ""}
                    </p>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
