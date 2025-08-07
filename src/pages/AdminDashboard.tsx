import { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  status: string;
  is_published: boolean;
  updated_at: string;
  estimated_duration: number | null;
};

const AdminDashboard = () => {
  useEffect(() => {
    document.title = "Admin — Esquads";
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("id,title,description,thumbnail_url,status,is_published,updated_at,estimated_duration")
        .order("updated_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return data as Course[];
    },
  });

  useEffect(() => {
    if (error) toast.error("Não foi possível carregar os cursos.");
  }, [error]);

  const canonical = useMemo(() => {
    try {
      return window.location.href;
    } catch {
      return "/admin";
    }
  }, []);

  const handleCreateCourse = async () => {
    const { data, error } = await supabase.from("courses").insert({
      title: "Novo Curso",
      description: "Rascunho criado pelo administrador",
      ai_generated: false,
      is_published: false,
      status: "draft",
    }).select("id").maybeSingle();

    if (error) {
      toast.error("Falha ao criar curso. Verifique permissões/autenticação.");
      return;
    }
    toast.success("Curso criado com sucesso.");
    refetch();
  };

  return (
    <>
      <Helmet>
        <title>Admin — Gerenciar cursos | Esquads</title>
        <meta name="description" content="Dashboard administrativo Esquads: gerencie cursos, rascunhos e publicações." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <main className="min-h-screen container mx-auto py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Administração</h1>
            <p className="text-muted-foreground">Gerencie cursos e publique conteúdos para os alunos.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => refetch()}>Atualizar</Button>
            <Button variant="hero" onClick={handleCreateCourse}>Novo curso</Button>
          </div>
        </header>

        <section aria-labelledby="galeria-cursos">
          <h2 id="galeria-cursos" className="sr-only">Galeria de cursos</h2>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-40 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (data && data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.map((course) => (
                <Card key={course.id} className="overflow-hidden">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={`Capa do curso ${course.title}`}
                      loading="lazy"
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="h-40 w-full bg-muted" aria-label="Sem imagem" />
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description || "Sem descrição"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <Badge variant={course.is_published ? "default" : "secondary"}>
                      {course.is_published ? "Publicado" : (course.status || "Rascunho")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Atualizado {new Date(course.updated_at).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <CardHeader>
                <CardTitle>Nenhum curso encontrado</CardTitle>
                <CardDescription>Crie seu primeiro curso para começar.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleCreateCourse}>Criar curso</Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </>
  );
};

export default AdminDashboard;
