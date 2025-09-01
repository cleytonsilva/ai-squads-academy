import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useTheme } from "@/contexts/theme-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface CourseLite { id: string; title: string; }

export default function TrackBuilder() {
  const { profile } = useCurrentProfile();
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const { data: courses } = useQuery({
    queryKey: ["published-courses"],
    queryFn: async (): Promise<CourseLite[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("id,title")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any;
    },
  });

  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const createTrack = async () => {
    if (!profile) return toast("Faça login para criar trilhas");
    if (!title.trim()) return toast("Dê um título à trilha");
    if (selectedIds.length === 0) return toast("Selecione ao menos 1 curso");

    try {
      setSaving(true);
      
      // Verificar se as tabelas necessárias existem
      const { data: track, error } = await supabase
        .from("tracks")
        .insert({ title: title.trim(), description: null, is_public: false, is_certifiable: false, status: "draft", created_by: profile.id })
        .select("id")
        .maybeSingle();
        
      if (error) {
        console.warn('Tabela tracks não encontrada ou erro ao criar trilha:', error);
        toast("Funcionalidade de trilhas não disponível no momento");
        return;
      }
      
      const trackId = track!.id as string;

      const rows = selectedIds.map((course_id, idx) => ({ track_id: trackId, course_id, order_index: idx + 1 }));
      const { error: e2 } = await supabase.from("track_courses").insert(rows);
      if (e2) {
        console.warn('Erro ao associar cursos à trilha:', e2);
        // Tentar deletar a trilha criada se falhou ao associar cursos
        await supabase.from("tracks").delete().eq("id", trackId);
        toast("Erro ao criar trilha - funcionalidade não disponível");
        return;
      }

      const { error: e3 } = await supabase.from("user_tracks").insert({ user_id: profile.id, track_id: trackId, status: "in_progress", progress: 0 });
      if (e3) {
        console.warn('Erro ao associar usuário à trilha:', e3);
      }

      toast("Trilha criada com sucesso");
      setTitle("");
      setSelected({});
    } catch (e: any) {
      console.error('Erro inesperado ao criar trilha:', e);
      toast("Erro ao criar trilha", { description: e?.message || 'Erro desconhecido' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={`animate-enter ${themeColors.card} ${themeColors.border} border transition-colors duration-200`}>
      <CardHeader>
        <CardTitle className={`${themeColors.cardForeground} tracking-wider`}>Crie sua trilha personalizada</CardTitle>
        <CardDescription className={`${themeColors.mutedForeground}`}>Selecione cursos publicados e gere sua trilha de estudos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="Título da trilha" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className={`md:col-span-2 text-sm ${themeColors.mutedForeground} font-mono`}>Dica: combine cursos complementares (ex.: Fundamentos + Cloud + Segurança)</div>
        </div>
        <Separator />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[320px] overflow-auto pr-1">
          {courses?.map((c) => (
            <label key={c.id} className={`flex items-center gap-2 rounded-md ${themeColors.border} border px-3 py-2 cursor-pointer hover:${themeColors.accent} transition-colors duration-200`}>
              <Checkbox checked={!!selected[c.id]} onCheckedChange={() => toggle(c.id)} />
              <span className={`truncate ${themeColors.cardForeground} text-sm`}>{c.title}</span>
            </label>
          ))}
          {!courses?.length && <p className={`text-sm ${themeColors.mutedForeground} font-mono text-center py-4`}>NENHUM CURSO PUBLICADO AINDA.</p>}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => { setTitle(""); setSelected({}); }} disabled={saving}>Limpar</Button>
          <Button variant="hero" onClick={createTrack} disabled={saving || !title.trim() || selectedIds.length === 0}>
            {saving ? "Criando..." : "Criar trilha"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
