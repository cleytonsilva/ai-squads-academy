import { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useGlobalCourseUpdates } from '@/hooks/useRealtimeCourseUpdates';
import { BookOpen } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null; // Preferential cover image field
  updated_at: string;
}

const Courses = () => {
  useEffect(() => { document.title = "Cursos — Esquads"; }, []);
  
  // Hook para atualizações globais de cursos
  useGlobalCourseUpdates();

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
            const imageUrlWithCache = imageUrl ? `${imageUrl}?t=${Date.now()}` : null;
            return (
              <Link key={course.id} to={`/courses/${course.id}`} className="block group">
                <Card className="overflow-hidden hover-scale cursor-pointer">
                  {imageUrlWithCache ? (
                    <img 
                      src={imageUrlWithCache} 
                      alt={`Capa do curso ${course.title}`} 
                      loading="lazy" 
                      className="h-40 w-full object-cover"
                      onError={(e) => {
                        // Fallback para imagem padrão em caso de erro
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.appendChild(
                          Object.assign(document.createElement('div'), {
                            className: 'h-40 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center',
                            innerHTML: '<svg class="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>'
                          })
                        );
                      }}
                    />
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-white" />
                    </div>
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
