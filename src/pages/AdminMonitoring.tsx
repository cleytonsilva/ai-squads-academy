import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminMonitoring() {
  const canonical = useMemo(() => {
    try { return window.location.href; } catch { return "/admin/monitoring"; }
  }, []);

  const { data: users, refetch } = useQuery({
    queryKey: ["admin-users-latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, role, xp, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: ranking } = useQuery({
    queryKey: ["admin-users-ranking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, xp")
        .order("xp", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <main className="container mx-auto py-10 space-y-8">
      <Helmet>
        <title>Monitoramento — Usuários e Ranking | Esquads</title>
        <meta name="description" content="Acompanhe criação de usuários, ranking por XP e evolução básica." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Monitoramento</h1>
          <Button variant="secondary" onClick={() => refetch()}>Atualizar</Button>
        </div>
        <p className="text-muted-foreground">Últimos usuários e ranking geral por XP.</p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Últimos usuários</CardTitle>
            <CardDescription>Registros mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            {!users?.length ? (
              <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
            ) : (
              <ul className="space-y-2">
                {users.map((u) => (
                  <li key={u.id} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[60%]">{u.display_name || u.id}</span>
                    <span className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ranking por XP</CardTitle>
            <CardDescription>Top 10 alunos</CardDescription>
          </CardHeader>
          <CardContent>
            {!ranking?.length ? (
              <p className="text-sm text-muted-foreground">Sem dados de XP ainda.</p>
            ) : (
              <ol className="space-y-2 list-decimal pl-5">
                {ranking.map((u, idx) => (
                  <li key={u.id} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[60%]">{u.display_name || u.id}</span>
                    <span className="text-muted-foreground">{u.xp} XP</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
            <CardDescription>Remoção e auditoria</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Remoções e edições de usuários exigem políticas específicas de RLS que ainda não permitem DELETE em perfis. Este painel foca em observabilidade.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
