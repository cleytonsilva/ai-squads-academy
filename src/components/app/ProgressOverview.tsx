import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ProgressRow { course_id: string; completion_percentage: number | null; }
interface Course { id: string; title: string; }

export default function ProgressOverview() {
  const { profile } = useCurrentProfile();

  const { data: progress } = useQuery({
    queryKey: ["user-progress", profile?.id],
    enabled: !!profile?.id,
    queryFn: async (): Promise<ProgressRow[]> => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("course_id,completion_percentage")
        .eq("user_id", profile!.id);
      if (error) throw error;
      return (data || []) as any;
    },
  });

  const courseIds = useMemo(() => Array.from(new Set((progress || []).map(p => p.course_id).filter(Boolean))), [progress]);
  const { data: courses } = useQuery({
    queryKey: ["progress-courses", courseIds.join(",")],
    enabled: courseIds.length > 0,
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("id,title")
        .in("id", courseIds);
      if (error) throw error;
      return data as any;
    },
  });

  const titleMap = useMemo(() => Object.fromEntries((courses || []).map(c => [c.id, c.title])), [courses]);
  const byCourse = useMemo(() => {
    const grouped: Record<string, number[]> = {};
    (progress || []).forEach((p) => {
      if (!p.course_id) return;
      const val = typeof p.completion_percentage === "number" ? p.completion_percentage : 0;
      grouped[p.course_id] = grouped[p.course_id] ? [...grouped[p.course_id], val] : [val];
    });
    return Object.keys(grouped).map((id) => ({ id, title: titleMap[id] || id, completion: Math.round(grouped[id].reduce((a,b)=>a+b,0) / grouped[id].length) }));
  }, [progress, titleMap]);

  const overall = useMemo(() => {
    if (!byCourse.length) return 0;
    return Math.round(byCourse.reduce((a,b)=>a + b.completion,0) / byCourse.length);
  }, [byCourse]);

  const palette = ["hsl(var(--brand))", "hsl(var(--brand-2))", "hsl(var(--primary))", "hsl(var(--accent-foreground))"]; 

  return (
    <Card className="animate-enter">
      <CardHeader>
        <CardTitle>Progresso dos cursos</CardTitle>
        <CardDescription>Acompanhe suas conclusões por curso.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm mb-2">Progresso geral</p>
          <Progress value={overall} />
          <p className="text-xs text-muted-foreground mt-1">{overall}% concluído</p>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCourse}>
              <XAxis dataKey="title" hide tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: "hsl(var(--muted))" }} formatter={(v: any) => `${v}%`} />
              <Bar dataKey="completion" radius={[6,6,0,0]}>
                {byCourse.map((_, idx) => (
                  <Cell key={idx} fill={palette[idx % palette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
