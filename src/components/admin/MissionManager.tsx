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

  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ["missions", courseId],
    queryFn: async (): Promise<Mission[]> => {
      try {
        const { data, error } = await supabase
          .from("missions")
          .select("id,title,status,points,module_id")
          .eq("course_id", courseId)
          .order("order_index", { ascending: true });
        
        if (error) {
          console.error("Error fetching missions:", error);
          // Se a tabela não existe, retorna array vazio em vez de erro
          if (error.message?.includes("relation \"public.missions\" does not exist") || 
              error.message?.includes("404")) {
            console.warn("Missions table not found, returning empty array");
            return [];
          }
          throw error;
        }
        
        return data as unknown as Mission[];
      } catch (err) {
        console.error("Failed to fetch missions:", err);
        throw err;
      }
    },
    retry: (failureCount, error: any) => {
      // Não tentar novamente se a tabela não existe
      if (error?.message?.includes("relation \"public.missions\" does not exist") ||
          error?.message?.includes("404")) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const handleCreate = async () => {
    try {
      const { error } = await supabase.from("missions").insert({
        course_id: courseId,
        title: title.trim() || "Nova Missão",
        status,
        points,
        module_id: moduleId || null,
        order_index: (data?.length || 0) + 1,
        requirements: [],
      });
      
      if (error) {
        console.error("Error creating mission:", error);
        if (error.message?.includes("relation \"public.missions\" does not exist")) {
          toast.error("Tabela de missões não encontrada. Verifique a configuração do banco de dados.");
        } else {
          toast.error(`Erro ao criar missão: ${error.message}`);
        }
        return;
      }
      
      toast.success("Missão criada");
      setTitle("");
      setPoints(50);
      setStatus("available");
      setModuleId(undefined);
      refetch();
    } catch (err) {
      console.error("Failed to create mission:", err);
      toast.error("Erro inesperado ao criar missão");
    }
  };

  const remove = async (id: string) => {
    try {
      const { error } = await supabase.from("missions").delete().eq("id", id);
      
      if (error) {
        console.error("Error removing mission:", error);
        if (error.message?.includes("relation \"public.missions\" does not exist")) {
          toast.error("Tabela de missões não encontrada. Verifique a configuração do banco de dados.");
        } else {
          toast.error(`Erro ao remover missão: ${error.message}`);
        }
        return;
      }
      
      toast.success("Missão removida");
      refetch();
    } catch (err) {
      console.error("Failed to remove mission:", err);
      toast.error("Erro inesperado ao remover missão");
    }
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
            <Select value={moduleId ?? "__none__"} onValueChange={(v) => setModuleId(v === "__none__" ? undefined : v)}>
              <SelectTrigger><SelectValue placeholder="Vincular módulo (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sem vínculo</SelectItem>
                {modules.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleCreate}>Adicionar missão</Button>
          </div>
          <Separator />
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando missões...</p>
          ) : queryError ? (
            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
              <p className="text-sm text-yellow-800 font-medium">Aviso: Problema ao carregar missões</p>
              <p className="text-xs text-yellow-700 mt-1">
                {queryError.message?.includes("relation \"public.missions\" does not exist") || 
                 queryError.message?.includes("404") 
                  ? "A tabela de missões ainda não foi criada no banco de dados. As funcionalidades de missões estarão disponíveis após a configuração."
                  : `Erro: ${queryError.message}`}
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2" 
                onClick={() => refetch()}
              >
                Tentar novamente
              </Button>
            </div>
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
