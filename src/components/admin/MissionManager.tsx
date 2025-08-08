import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export interface ModuleOption {
  id: string;
  title: string;
}

interface Mission {
  id: string;
  title: string;
  status: string;
  points: number;
  module_id: string | null;
}

const statuses = [
  { value: "available", label: "Disponível" },
  { value: "in_progress", label: "Em progresso" },
  { value: "completed", label: "Concluída" },
];

export default function MissionManager({ courseId, modules }: { courseId: string; modules: ModuleOption[] }) {
  const [title, setTitle] = useState("");
  const [points, setPoints] = useState<number>(50);
  const [status, setStatus] = useState<string>("available");
  const [moduleId, setModuleId] = useState<string | undefined>(undefined);

  const moduleMap = useMemo(() => Object.fromEntries(modules.map(m => [m.id, m.title])), [modules]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["missions", courseId],
    queryFn: async (): Promise<Mission[]> => {
      const { data, error } = await supabase
        .from("missions")
        .select("id,title,status,points,module_id")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as unknown as Mission[];
    },
  });

  const handleCreate = async () => {
    const { error } = await supabase.from("missions").insert({
      course_id: courseId,
      title: title.trim() || "Nova Missão",
      status,
      points,
      module_id: moduleId || null,
      order_index: (data?.length || 0) + 1,
      requirements: [],
    });
    if (error) return toast.error("Erro ao criar missão");
    toast.success("Missão criada");
    setTitle("");
    setPoints(50);
    setStatus("available");
    setModuleId(undefined);
    refetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("missions").delete().eq("id", id);
    if (error) return toast.error("Erro ao remover missão");
    toast.success("Removida");
    refetch();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Missões</CardTitle>
          <CardDescription>Defina atividades práticas e a pontuação (XP).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Input placeholder="Título da missão" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input type="number" min={0} placeholder="Pontos" value={points} onChange={(e) => setPoints(Number(e.target.value))} />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={moduleId} onValueChange={setModuleId}>
              <SelectTrigger><SelectValue placeholder="Vincular módulo (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={""}>Sem vínculo</SelectItem>
                {modules.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleCreate}>Adicionar missão</Button>
          </div>
          <Separator />
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando missões...</p>
          ) : data && data.length > 0 ? (
            <ul className="space-y-2">
              {data.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {`Status: ${m.status} • Pontos: ${m.points}`}
                      {m.module_id ? ` • Módulo: ${moduleMap[m.module_id] || "-"}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => remove(m.id)}>Excluir</Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma missão ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
