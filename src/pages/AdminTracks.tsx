import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import TrackQuizManager from "@/components/admin/TrackQuizManager";
import TrackMissionManager from "@/components/admin/TrackMissionManager";

interface Track { id: string; title: string; is_public: boolean; is_certifiable: boolean; created_by: string | null; updated_at: string; }
interface Course { id: string; title: string; }
interface TrackCourse { id: string; course_id: string; order_index: number; }

export default function AdminTracks() {
  const { profile } = useCurrentProfile();
  const isAdmin = profile?.role === "admin" || profile?.role === "instructor";

  const { data: tracks, refetch } = useQuery({
    queryKey: ["tracks", isAdmin, profile?.id],
    enabled: !!profile,
    queryFn: async (): Promise<Track[]> => {
      let query = supabase.from("tracks").select("id,title,is_public,is_certifiable,created_by,updated_at").order("updated_at", { ascending: false }).limit(50);
      if (!isAdmin && profile) query = query.eq("created_by", profile.id);
      const { data, error } = await query;
      if (error) throw error;
      return data as any;
    },
  });

  const { data: courses } = useQuery({
    queryKey: ["all-courses"],
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase.from("courses").select("id,title").order("title", { ascending: true });
      if (error) throw error;
      return data as any;
    },
  });

  const [newTitle, setNewTitle] = useState("");
  const [isPublic, setIsPublic] = useState("false");
  const [isCert, setIsCert] = useState("false");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedTrack = useMemo(() => tracks?.find(t => t.id === selectedId) || null, [tracks, selectedId]);

  const { data: trackCourses, refetch: refetchTC } = useQuery({
    queryKey: ["track-courses", selectedId],
    enabled: !!selectedId,
    queryFn: async (): Promise<TrackCourse[]> => {
      const { data, error } = await supabase.from("track_courses").select("id,course_id,order_index").eq("track_id", selectedId!).order("order_index", { ascending: true });
      if (error) throw error;
      return data as any;
    },
  });

  const addTrack = async () => {
    if (!profile) return toast("Faça login.");
    try {
      const { data, error } = await supabase
        .from("tracks")
        .insert({ title: newTitle.trim() || "Nova trilha", is_public: isPublic === "true", is_certifiable: isCert === "true", created_by: profile.id })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      toast("Trilha criada");
      setNewTitle("");
      refetch();
      setSelectedId(data?.id || null);
    } catch (e: any) {
      toast("Erro ao criar trilha", { description: e.message });
    }
  };

  const [courseToAdd, setCourseToAdd] = useState<string | undefined>(undefined);
  const addCourse = async () => {
    if (!selectedId || !courseToAdd) return;
    const nextIdx = (trackCourses?.[trackCourses.length - 1]?.order_index || 0) + 1;
    const { error } = await supabase.from("track_courses").insert({ track_id: selectedId, course_id: courseToAdd, order_index: nextIdx });
    if (error) return toast("Erro ao adicionar curso");
    setCourseToAdd(undefined);
    refetchTC();
  };

  const removeCourse = async (id: string) => {
    const { error } = await supabase.from("track_courses").delete().eq("id", id);
    if (error) return toast("Erro ao remover");
    refetchTC();
  };

  return (
    <main className="min-h-screen container mx-auto py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trilhas</h1>
          <p className="text-muted-foreground">Crie e gerencie trilhas (coleções de cursos).</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Nova trilha</CardTitle>
            <CardDescription>Defina o básico e crie.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Título" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Pública?</label>
                <Select value={isPublic} onValueChange={setIsPublic}>
                  <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Não</SelectItem>
                    <SelectItem value="true">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Certificável?</label>
                <Select value={isCert} onValueChange={setIsCert}>
                  <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Não</SelectItem>
                    <SelectItem value="true">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button variant="hero" onClick={addTrack} disabled={!newTitle.trim()}>Criar</Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Minhas trilhas {isAdmin ? "(todas)" : ""}</CardTitle>
            <CardDescription>Selecione para gerenciar cursos e avaliações.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {(tracks || []).map((t) => (
                <button key={t.id} onClick={() => setSelectedId(t.id)} className={`rounded-md border p-3 text-left transition hover:bg-accent/50 ${selectedId===t.id?"bg-accent":""}`}>
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground">Atualizada {new Date(t.updated_at).toLocaleDateString()}</div>
                </button>
              ))}
              {(!tracks || tracks.length===0) && <p className="text-sm text-muted-foreground">Nenhuma trilha.</p>}
            </div>

            {selectedTrack && (
              <div className="space-y-4 animate-enter">
                <Separator />
                <h3 className="font-medium">Cursos da trilha</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={courseToAdd} onValueChange={setCourseToAdd}>
                    <SelectTrigger className="w-64"><SelectValue placeholder="Adicionar curso" /></SelectTrigger>
                    <SelectContent>
                      {(courses || []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addCourse} disabled={!courseToAdd}>Adicionar</Button>
                </div>
                <div className="space-y-2">
                  {(trackCourses || []).map((tc) => {
                    const c = (courses || []).find(x => x.id === tc.course_id);
                    return (
                      <div key={tc.id} className="flex items-center justify-between rounded-md border p-2">
                        <span className="truncate">{tc.order_index}. {c?.title || tc.course_id}</span>
                        <Button size="sm" variant="outline" onClick={() => removeCourse(tc.id)}>Remover</Button>
                      </div>
                    );
                  })}
                  {(!trackCourses || trackCourses.length===0) && <p className="text-sm text-muted-foreground">Nenhum curso na trilha.</p>}
                </div>

                <Tabs defaultValue="quizzes">
                  <TabsList>
                    <TabsTrigger value="quizzes">Quizzes de certificação</TabsTrigger>
                    <TabsTrigger value="missoes">Missões</TabsTrigger>
                  </TabsList>
                  <TabsContent value="quizzes">
                    <TrackQuizManager trackId={selectedTrack.id} />
                  </TabsContent>
                  <TabsContent value="missoes">
                    <TrackMissionManager trackId={selectedTrack.id} />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
