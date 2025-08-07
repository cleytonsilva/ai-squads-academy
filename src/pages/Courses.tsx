import { useEffect } from "react";

const Courses = () => {
  useEffect(() => {
    document.title = "Cursos — Esquads";
  }, []);
  return (
    <main className="min-h-screen container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-4">Catálogo de Cursos</h1>
      <p className="text-muted-foreground">Conecte o Supabase para habilitar a geração automática de cursos e filtros personalizados.</p>
    </main>
  );
};

export default Courses;
