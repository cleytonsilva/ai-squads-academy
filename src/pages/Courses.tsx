import { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

interface Course {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null; // Preferential cover image field
  updated_at: string;
}

const Courses = () => {
  useEffect(() => { document.title = "Cursos — Esquads"; }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["catalog-courses"],
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("id,title,description,cover_image_url,updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return data as Course[];
    },
  });

  const canonical = useMemo(() => {
    try { return window.location.href } catch { return "/courses" }
  }, []);

  return (
    <main className="min-h-screen container mx-auto py-10">
      <Helmet>
        <title>Cursos publicados | Esquads</title>
        <meta name="description" content="Catálogo de cursos publicados da Esquads. Explore trilhas de TI e Cibersegurança." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="mb-8">
        <h1 className="text-3xl font-bold">Catálogo de Cursos</h1>
        <p className="text-muted-foreground">Veja os cursos publicados e prontos para estudar.</p>
      </header>

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
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.map((course) => {
            const imageUrl = course.cover_image_url; // Usando apenas cover_image_url
            return (
              <Link key={course.id} to={`/courses/${course.id}`} className="block group">
                <Card className="overflow-hidden hover-scale cursor-pointer">
                  {imageUrl ? (
                    <img src={imageUrl} alt={`Capa do curso ${course.title}`} loading="lazy" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="h-40 w-full bg-muted" aria-label="Sem imagem" />
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{course.description || "Sem descrição"}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <Badge>Publicado</Badge>
                    <span className="text-xs text-muted-foreground">Atualizado {new Date(course.updated_at).toLocaleDateString()}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <CardHeader>
            <CardTitle>Nenhum curso publicado</CardTitle>
            <CardDescription>Volte mais tarde, novos cursos chegam em breve.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </main>
  );
};

export default Courses;
