import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectItem, SelectValue, SelectContent } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Mission { id: string; title: string; status: string; points: number; course_id: string }
const statuses = [
  { value: "available", label: "Disponível" },
  { value: "in_progress", label: "Em progresso" },
  { value: "completed", label: "Concluída" },
];
interface TrackCourse { course_id: string }
interface Course { id: string; title: string }

export default function TrackMissionManager({ trackId }: { trackId: string }) {
  const [title, setTitle] = useState("");
  const [points, setPoints] = useState<number>(50);
  const [status, setStatus] = useState<string>("available");
  const [courseId, setCourseId] = useState<string | undefined>(undefined);

  const { data: tcs } = useQuery({
    queryKey: ["track-courses-for-missions", trackId],
    queryFn: async (): Promise<TrackCourse[]> => {
      const { data, error } = await supabase.from("track_courses").select("course_id").eq("track_id", trackId);
      if (error) throw error;
      return data as any;
    }
  });
  const courseIds = useMemo(() => Array.from(new Set((tcs || []).map(t => t.course_id))), [tcs]);
  const { data: courses } = useQuery({
    queryKey: ["courses-in-track-missions", courseIds.join(",")],
    enabled: courseIds.length > 0,
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase.from("courses").select("id,title").in("id", courseIds);
      if (error) throw error;
      return data as any;
    }
  });

  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ["track-missions", trackId, courseIds.join(",")],
    enabled: courseIds.length > 0,
    queryFn: async (): Promise<Mission[]> => {
      try {
        const { data, error } = await supabase
          .from("missions")
          .select("id,title,status,points,course_id")
          .in("course_id", courseIds)
          .order("order_index", { ascending: true });
        
        if (error) {
          console.error("Error fetching track missions:", error);
          // Se a tabela não existe, retorna array vazio em vez de erro
          if (error.message?.includes("relation \"public.missions\" does not exist") || 
              error.message?.includes("404")) {
            console.warn("Missions table not found, returning empty array");
            return [];
          }
          throw error;
        }
        
        return data as any;
      } catch (err) {
        console.error("Failed to fetch track missions:", err);
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

  const createMission = async () => {
    if (!courseId) return toast("Escolha um curso da trilha");
    
    try {
      const { error } = await supabase.from("missions").insert({ 
        course_id: courseId, 
        title: title.trim() || "Nova Missão", 
        status, 
        points, 
        order_index: (data?.length || 0) + 1, 
        requirements: [] 
      });
      
      if (error) {
        console.error("Error creating track mission:", error);
        if (error.message?.includes("relation \"public.missions\" does not exist")) {
          toast("Tabela de missões não encontrada. Verifique a configuração do banco de dados.");
        } else {
          toast(`Erro ao criar missão: ${error.message}`);
        }
        return;
      }
      
      toast("Missão criada com sucesso");
      setTitle(""); 
      setPoints(50); 
      setStatus("available"); 
      refetch();
    } catch (err) {
      console.error("Failed to create track mission:", err);
      toast("Erro inesperado ao criar missão");
    }
  };

  const remove = async (id: string) => {
    try {
      const { error } = await supabase.from("missions").delete().eq("id", id);
      
      if (error) {
        console.error("Error removing track mission:", error);
        if (error.message?.includes("relation \"public.missions\" does not exist")) {
          toast("Tabela de missões não encontrada. Verifique a configuração do banco de dados.");
        } else {
          toast(`Erro ao remover missão: ${error.message}`);
        }
        return;
      }
      
      toast("Missão removida com sucesso");
      refetch();
    } catch (err) {
      console.error("Failed to remove track mission:", err);
      toast("Erro inesperado ao remover missão");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Missões da trilha</CardTitle>
        <CardDescription>Adicione checkpoints vinculados a um curso desta trilha.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Input placeholder="Título" value={title} onChange={(e)=>setTitle(e.target.value)} />
          <Input type="number" min={0} placeholder="Pontos" value={points} onChange={(e)=>setPoints(Number(e.target.value))} />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger><SelectValue placeholder="Curso da trilha" /></SelectTrigger>
            <SelectContent>
              {(courses || []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={createMission}>Adicionar</Button>
        </div>
        <Separator />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando missões...</p>
        ) : queryError ? (
          <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
            <p className="text-sm text-yellow-800 font-medium">Aviso: Problema ao carregar missões da trilha</p>
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
        ) : (data && data.length > 0 ? (
          <ul className="space-y-2">
            {data.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{m.title}</p>
                  <p className="text-sm text-muted-foreground truncate">Status: {m.status} • Pontos: {m.points}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => remove(m.id)}>Excluir</Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma missão ainda.</p>
        ))}
      </CardContent>
    </Card>
  );
}
